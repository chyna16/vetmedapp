const config = {
    baseUrl: 'http://work.liu.edu/vetmed-api/',
    authUrl: 'http://work.liu.edu/BITool/',
    mode: 'prod', // debug or prod
    debugInfo: {
        InqID: 481659980,
        mockUser: {
            name: 'Kiichi Takeuchi',
            token: 'F33EA0E82D83EC1127FDB3AA39E1086DC2BA2FAB44CCD94188C002A86D84F461B5191719BC15CE4B06F54BE88557685E0F48FDFABC09A8121B38DF001F6BE949',
            uname: 'ktakeuch',
            emplid: '100001434',
            role: 'R', // [A]dmin or [R]eviewer,
            VetGroupId: 100
        },
        mockLookup: {
            VetGroups: [{ "Username":"jfusco", "Name":"Justin Fusco", "VetGroupID":1},{ "Username":"ktakeuch", "Name":"Kiichi Takeuchi", "VetGroupID":100},{ "Username":"khennegan", "Name":"Korey Hennegan", "VetGroupID":1},{ "Username":"rmontgomery", "Name":"Ryan Montgomery", "VetGroupID":100},{ "Username":"cbrowne01", "Name":"Chyna Browne", "VetGroupID":3},{ "Username":"jlau", "Name":"Justin Lau", "VetGroupID":3},{ "Username":"snewman", "Name":"Shelley Newman", "VetGroupID":4},{ "Username":"tbasile", "Name":"Tamara Basile", "VetGroupID":4}]
        }
    },
    // when we need to shutdown certain pages, list component names here
    readOnlyComponents: [
        //"tab-grammar" 
    ]
};
export default config;