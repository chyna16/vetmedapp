////////////////////////////////////////////////////////////////////////////////
// Routing Manager
class Router extends Navigo {
    //constructor(...args){
    //  super(...args);
    constructor(service) {
        super(null, true);
        this.service = service;
        this
        .on('/welcome', () => {
            this.service.goto('welcome');
        })
        .on('/academic', () => {
            this.service.goto('academic');
        })
        .on('/non-academic', () => {
            this.service.goto('non-academic');
        })
        .on('/interview', () => {
            this.service.goto('interview');
        })
        .on('/report', () => {
            this.service.goto('report');
        })
        .resolve();
    }
}

export default Router;