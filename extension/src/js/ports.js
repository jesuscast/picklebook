/*
* Note: Accessing this from the background script context is
* different than accessing this from the content script context.
*/

let actionPagePort = null;
let backgroundPort = null;
let passwordModalPort = null;
let challengeModalPort = null;

let contentPorts = {};
let appPorts = {};


let changeListeners = {
  actionPage: [],
  contentScript: [],
  app: [],
  backgroundPage: [],
  passwordModal: [],
  challengeModal: []
};

let setters = {
  actionPage: function(port) {
    actionPagePort = port;
  },
  contentScript: function(port, tabId) {
    contentPorts[tabId] = port;
  },
  app: function(port, tabId) {
    appPorts[tabId] = port;
  },
  backgroundPage: function(port) {
    backgroundPort = port;
  },
  passwordModal: function(port) {
    passwordModalPort = port;
  },
  challengeModal: function(port) {
    challengeModalPort = port;
  }
};

let getters = {
  actionPage: function() {
    return new Promise((resolve, reject) => {
      resolve(actionPagePort);
    });
  },
  contentScript: function(tab) {
    return new Promise((resolve, reject) => {
      if(!tab) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (!tabs || tabs.length == 0) {
            reject("No content script port found");
            return;
          }
          resolve(contentPorts[tabs[0].id]);
        });
      } else {
        resolve(contentPorts[tab.id]);
      }
    });
  },
  app: function(tab) {
    return new Promise((resolve, reject) => {
      if(!tab) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (!tabs || tabs.length == 0) {
            reject('No active tab found');
            return;
          }
          resolve({ port: appPorts[tabs[0].id], tab: tabs[0] });
        });
      } else {
        resolve({ port: appPorts[tab.id], tab })
      }
    });
  },
  backgroundPage: function() {
    return new Promise((resolve, reject) => {
      resolve(backgroundPort);
    });
  },
  passwordModal: function() {
    return new Promise((resolve, reject) => {
      resolve(passwordModalPort);
    });
  },
  challengeModal: function() {
    return new Promise((resolve, reject) => {
      resolve(challengeModalPort);
    });
  }
};

let PortUtil = {
  setPort: function(page, port) {
    if ( Object.keys(setters).indexOf(page) == -1 ){
      console.log('Port name not available');
      return;
    }
    if (!port) {
      console.log('Port is not defined');
      return;
    }
    let tabId = null;
    if (port.sender && port.sender.tab) {
      tabId = port.sender.tab.id;
    }
    setters[page](port, tabId);
    port.onDisconnect.addListener(() => {
      setters[page](null, tabId);
    });
    changeListeners[page].forEach((callback) => {
      callback();
    });
  },
  getPort: function(page, tab) {
    if ( Object.keys(setters).indexOf(page) == -1 ){
      console.log('Port name not available');
      return;
    }
    return getters[page](tab);
  },
  /**
  * Returns all app ports.
  */
  getAppPorts: function(page) {
    return appPorts;
  },
  /**
  * Returns all content script ports.
  */
  getContentScriptPorts: function(page) {
    return contentPorts;
  },
  addListener: function(page, callback) {
    if ( Object.keys(changeListeners).indexOf(page) == -1 ){
      console.log('Port name not available');
      return;
    }
    changeListeners[page].push(callback);
  }
}

module.exports = PortUtil;