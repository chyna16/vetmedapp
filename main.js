////////////////////////////////////////////////////////////////////////////////
// Initializing App
////////////////////////////////////////////////////////////////////////////////
import config from './config.js';
import Service from './service.js';
import Router from './router.js';
import BaseTabComponent from './base-tab-component.js';
window.BaseTabComponent = BaseTabComponent; // loading globally. or riot.BaseTabComponent = BaseTabComponent 

////////////////////////////////////////////////////////////////////////////////
// Store Template
const defaultStore = {
  count: 0, // for testing only
  page: '',
  searchState: 'stopped',
  isLoggedIn: false,
  lastLoginError: '',
  user: {
    uname: '',
    name: '',
    token: '',
    role: 'R'
  },
  app: {},
  review: {},
  newApps:[],
  comments:[] // TODO: should we put this under review or separate
};

function hasRiotTags(){
  // Call compile if tag is used in script tag
  const riotScripts = document.querySelectorAll('script[type=riot]');
  if (riotScripts.length > 0){
    return true;
  }
  return false;
}


////////////////////////////////////////////////////////////////////////////////
// Main
(async function main() {
  if (hasRiotTags()){
    await riot.compile()
    riot.mount('compile-me');
  }

  ////////////////////////////////////////////////////////////////////////////////
  // State Management
  // Install state management classes as component's plugin so that you can access everywhere
  const store = datoramaAkita.createStore(defaultStore, { name: 'repository' });
  const query = datoramaAkita.createQuery(store);
  const service = new Service(store, axios, config);
  const router = new Router(service);

  riot.install((component) => {
    //console.log('installing in each component....');
    component.store = store;
    component.query = query;
    component.service = service;
    component.router = router;
    component.config = config;
  });

  riot.mount('app');
}())