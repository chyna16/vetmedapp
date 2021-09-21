////////////////////////////////////////////////////////////////////////////////
// Service to dispatch the action, and update state in store.
class Service {
    constructor(store, http, config) {
        this.store = store;
        this.defaultStore = store.store.getValue(); // keep the copy of initial state
        this.http = http;
        this.config = config;
        this.currentUser = null;
        this.criteriaCatalog = [];
        this.initHttp();
    }

    initHttp(){
        this.http.interceptors.request.use((config) => {
            if (this.currentUser) {
                config.headers.common['token'] = this.currentUser.token;
                config.headers.common['id'] = this.currentUser.uname;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        

        this.http.interceptors.response.use((response) => {
            return response;
        }, (error) => {
            this.logError('Unexpected Server Error (' + JSON.stringify(error) + ')');
        });
    }
    
    goto(page) {
        // check role etc - like route guard
        this.store.update({
            page: page
        });
    }

    async login(username, password) {
        const payload = {
            LDAPUser: username,
            LDAPPass: password,
            module: 'VETMED'
        };
        const res = await this.http.post( this.config.authUrl+'Auth/LDAP', payload);
        if (res.data.Status === 'ok') {
            this.currentUser = {
                name: res.data.Data.name,
                token: res.data.Data.token,
                uname: res.data.Data.uname,
                role : res.data.Data.extendeddata.VetAccessLevel,
                VetGroupId : res.data.Data.extendeddata.VetGroupID
            };
            this.store.update({
                isLoggedIn: true,
                lastLoginError: '',
                user: this.currentUser,
                lookup: {
                    VetGroups: JSON.parse(res.data.Data.extendeddata.VetGroups)
                }
            });

            // keep catalog data in memory
            this.criteriaCatalog = await this.getCriteriaCatalog();
        } 
        else {
            this.store.update({
                lastLoginError: res.data.Message
            });
            console.warn('error', res);
        }
        return res;
    }

    async getCriteriaCatalog(){
        const cat = await this.http.get(this.config.baseUrl + 'CriteriaCatalog');
        return cat.data.result;
    }

    async dummyLogin() {
        this.currentUser = this.config.debugInfo.mockUser;
        this.criteriaCatalog = await this.getCriteriaCatalog();
        this.store.update({
            isLoggedIn: true,
            lastLoginError: '',
            user: this.currentUser,
            lookup: this.config.debugInfo.mockLookup
        });
    }

    logout() {
        this.currentUser = null;
        this.store.update(this.defaultStore);
        console.log('logout called');
    }

    logError(message){
        this.store.update({ lastError: message  });
        if (message){
            console.error('error', message);
        }
    }

    async loadAppData(inqId) {
        if (!inqId) return;
        const res = await this.http.get(this.config.baseUrl + 'Student/' + inqId);
        const scores  = await this.http.get(this.config.baseUrl+'Application/Academic/'+inqId);
        const equivalencies = await this.http.get(this.config.baseUrl+'Application/Equivalencies/'+inqId);
        const reviewedEquivalencies = await this.http.get(this.config.baseUrl+'Application/Equivalencies/Review/'+inqId);

        if (res.data.status === 'ok') {
            this.store.update({
                app: Object.assign({},
                    res.data.result,
                    scores.data.result[0],
                    {   Equivalencies:equivalencies.data.result,
                        ReviewedEquivalencies:reviewedEquivalencies.data.result
                    })
            });
        } 
        else {
            this.logError(res.data.message);
        }
    }

    async initReviewData(inqId, username) {
        const payload = {};
        const res = await this.http.post(this.config.baseUrl + 'CriteriaData/Init/' + inqId + '/VETMED/' + username, payload);

        // Temp massage until Ryan fix the backend
        var mapped = res.data.result.reduce((acc, obj) => ({
            ...acc,
            [obj.Name]: obj.Value
        }), {});
        mapped['ReviewID'] = res.data.result[0].ReviewID;

        if (res.data.status === 'ok') {
            this.store.update({
                review: mapped
            });
        } 
        else {
            this.logError(res.data.message);
        }
    }

    async saveReviewData(reviewId, name, value) {
        var payload = {
            [name]: value
        };
        const res = await this.http.put(this.config.baseUrl + 'CriteriaData/' + reviewId, payload);
        if (res.data.status === 'ok') {
            this.store.update(state => ({
                review: {
                    ...state.review,
                    ...payload
                }
            }));
            //console.log('after exit',this.store.storeValue.review);
        }
        else {
            this.logError('ERROR: ' + res.data.message + ' (ReviewID:' + reviewId + ', ' + name + ', ' + value + ') ');
        }
    }

    async saveReviewedEquivalency(inqId,payload){
        const res = await this.http.put(this.config.baseUrl + 'Application/Equivalencies/Review/'+inqId,[payload]);
        if(res && res.data.status ==='ok'){
            await this.loadAppData(inqId);
            return res.data.result;
        }
        else{
            this.logError(res.data.message);
        }
    }
    
    async flagAppData(inqId,value){
        let payload = {
            "marked":value
        };
        const res = await this.http.put(this.config.baseUrl + 'Application/Flag/'+inqId,payload);
        if(res && res.data.status ==='ok'){
            return res.data.result;
        }
        else{
            this.logError(res.data.message);
        }
    }

    async getComments(inqId) {
        const res = await this.http.get(this.config.baseUrl + 'Comment/?ReviewID=0' + '&inqId=' + inqId);
        if (res && res.data.status === 'ok') {
            this.store.update({
                comments: res.data.result
            });
        } 
        else {
            this.logError(res.data.message);
        }
    }

    async addComment(reviewId, inqId, message){
        var payload = {
            Message: message,
            ReviewID: reviewId,
            InqID: inqId
        };
        const res = await this.http.post(this.config.baseUrl+'Comment/',payload);
        if (res && res.data.status === 'ok') {
            console.log(res.data);
            // TODO: It's better to get the object back
            this.store.update(state => ({
                comments: [res.data.result].concat(state.comments)
            }));
        }
        else {
            this.logError('ERROR: ' + res.data.message);
        }
    }

    async getNewApplications(max){
        const res = await this.http.get(this.config.baseUrl + 'Applications/New/' + max);
        if (res.data.status === 'ok') {
            this.store.update({ newApps: res.data.result });
        } 
        else {
            this.logError(res.data.message);
        } 
    }

    async saveAssignee(vetGroupId,inqId){
        var payload = {
            VetGroupID : vetGroupId,
            InqID : inqId
        }
        const res = await this.http.put(this.config.baseUrl+'Application/Assign/',payload);
        if (res && res.data.status === 'ok') {
            // just call the service, not mutating local store, until we need it
        }
        else {
            this.logError('ERROR: ' + res.data.message);
        } 
    }


    // Custom Init Functions for jQuery
    initSearchSelect(onSelectCallback) {
        var bloodhoundSuggestions = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            sufficient: 3,
            remote: {
                url: this.config.baseUrl + 'StudentSearch?search=',
                prepare: (query, settings) => {
                    settings.url = settings.url +query
                    settings.headers = {
                        "id": this.currentUser.uname,
                        "token": this.currentUser.token
                    };
                    return settings;
                },
                wildcard: '%QUERY',
                transform: ((res) => {
                    return ((res && res.result) || []);
                })
            }
        });

        $('#studentSearch').typeahead({
            hint: true,
            highlight: true,
            minLength: 3,
            async: true
        }, {
            name: 'suggestions',
            displayKey: ((item) => {
                return item["LastName"] + ', ' + item["FirstName"] + ' (' + (item["EMPLID"] || 'Unknown') + ', ' + item["InqID"] + ')'
            }),
            limit: 10,
            source: bloodhoundSuggestions
        }).bind('typeahead:select', (ev, suggestion) => {
            if (suggestion.InqID) {
                this.loadAppData(suggestion.InqID);
                if (onSelectCallback){
                    onSelectCallback(suggestion);
                }
            } else {
                alert('InqID Not Found');
            }
        }).bind('typeahead:asyncrequest', (ev, suggestion) => {
            this.store.update({
                searchState: 'searching'
            });
        }).bind('typeahead:asyncreceive', (ev, suggestion) => {
            this.store.update({
                searchState: 'stopped'
            });
        }).bind('typeahead:asynccancel', (ev, suggestion) => {
            this.store.update({
                searchState: 'stopped'
            });
        }).ready(() => {
            if (this.config.mode === 'debug') {
                this.loadAppData(this.config.debugInfo.InqID);
                if (onSelectCallback){
                    onSelectCallback();
                }
            }
        });
    }

    clearSearchInput(){
        $('#studentSearch').typeahead('val','');
    }

    setInputFields(arr, review) {
        for (let i = 0; i < arr.length; i++) {
            const val = review[arr[i].name];
            if (val) {
                arr[i].value = val;
            }
        }
    }

    lockInputFields(arr) {
        for (let i = 0; i < arr.length; i++) {
            arr[i].disabled = true;
        }
    }
}

export default Service;