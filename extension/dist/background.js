(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/unifyid/hacks/picklebook/extension/src/js/background.js":[function(require,module,exports){
'use strict';

var ports = require('./ports');
var LongLivedConnection = require('./longlived');
var ShortLivedConnections = require('./shortlived');

/**
* Everything between the angular app and the background script.
*/
chrome.runtime.onConnect.addListener(function (port) {
  ports.setPort(port.name, port);
  port.onMessage.addListener(function (request, sender, sendResponse) {
    setTimeout(function () {
      LongLivedConnection.get(request.message, port, request, sendResponse);
    }, 1);
    // Necessary to return true for async responses.
    return true;
  });
});

/**
 * Bug reporting section
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  setTimeout(function () {
    ShortLivedConnections.get(request.message, request, sender, sendResponse);
  }, 1);
  // Necessary to return true for async responses.
  return true;
});

},{"./longlived":"/Users/unifyid/hacks/picklebook/extension/src/js/longlived.js","./ports":"/Users/unifyid/hacks/picklebook/extension/src/js/ports.js","./shortlived":"/Users/unifyid/hacks/picklebook/extension/src/js/shortlived.js"}],"/Users/unifyid/hacks/picklebook/extension/src/js/longlived.js":[function(require,module,exports){
"use strict";

},{}],"/Users/unifyid/hacks/picklebook/extension/src/js/ports.js":[function(require,module,exports){
'use strict';

/*
* Note: Accessing this from the background script context is
* different than accessing this from the content script context.
*/

var actionPagePort = null;
var backgroundPort = null;
var passwordModalPort = null;
var challengeModalPort = null;

var contentPorts = {};
var appPorts = {};

var changeListeners = {
  actionPage: [],
  contentScript: [],
  app: [],
  backgroundPage: [],
  passwordModal: [],
  challengeModal: []
};

var setters = {
  actionPage: function actionPage(port) {
    actionPagePort = port;
  },
  contentScript: function contentScript(port, tabId) {
    contentPorts[tabId] = port;
  },
  app: function app(port, tabId) {
    appPorts[tabId] = port;
  },
  backgroundPage: function backgroundPage(port) {
    backgroundPort = port;
  },
  passwordModal: function passwordModal(port) {
    passwordModalPort = port;
  },
  challengeModal: function challengeModal(port) {
    challengeModalPort = port;
  }
};

var getters = {
  actionPage: function actionPage() {
    return new Promise(function (resolve, reject) {
      resolve(actionPagePort);
    });
  },
  contentScript: function contentScript(tab) {
    return new Promise(function (resolve, reject) {
      if (!tab) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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
  app: function app(tab) {
    return new Promise(function (resolve, reject) {
      if (!tab) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (!tabs || tabs.length == 0) {
            reject('No active tab found');
            return;
          }
          resolve({ port: appPorts[tabs[0].id], tab: tabs[0] });
        });
      } else {
        resolve({ port: appPorts[tab.id], tab: tab });
      }
    });
  },
  backgroundPage: function backgroundPage() {
    return new Promise(function (resolve, reject) {
      resolve(backgroundPort);
    });
  },
  passwordModal: function passwordModal() {
    return new Promise(function (resolve, reject) {
      resolve(passwordModalPort);
    });
  },
  challengeModal: function challengeModal() {
    return new Promise(function (resolve, reject) {
      resolve(challengeModalPort);
    });
  }
};

var PortUtil = {
  setPort: function setPort(page, port) {
    if (Object.keys(setters).indexOf(page) == -1) {
      console.log('Port name not available');
      return;
    }
    if (!port) {
      console.log('Port is not defined');
      return;
    }
    var tabId = null;
    if (port.sender && port.sender.tab) {
      tabId = port.sender.tab.id;
    }
    setters[page](port, tabId);
    port.onDisconnect.addListener(function () {
      setters[page](null, tabId);
    });
    changeListeners[page].forEach(function (callback) {
      callback();
    });
  },
  getPort: function getPort(page, tab) {
    if (Object.keys(setters).indexOf(page) == -1) {
      console.log('Port name not available');
      return;
    }
    return getters[page](tab);
  },
  /**
  * Returns all app ports.
  */
  getAppPorts: function getAppPorts(page) {
    return appPorts;
  },
  /**
  * Returns all content script ports.
  */
  getContentScriptPorts: function getContentScriptPorts(page) {
    return contentPorts;
  },
  addListener: function addListener(page, callback) {
    if (Object.keys(changeListeners).indexOf(page) == -1) {
      console.log('Port name not available');
      return;
    }
    changeListeners[page].push(callback);
  }
};

module.exports = PortUtil;

},{}],"/Users/unifyid/hacks/picklebook/extension/src/js/router.js":[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var StateMachine = require('./statemachine');

var Router = function (_StateMachine) {
  _inherits(Router, _StateMachine);

  function Router() {
    _classCallCheck(this, Router);

    var _this = _possibleConstructorReturn(this, (Router.__proto__ || Object.getPrototypeOf(Router)).call(this));

    _this.routable = true;
    _this.submodules = {};
    return _this;
  }

  _createClass(Router, [{
    key: "get",
    value: function get(entirePath) {
      var pathsList = entirePath.split("/");

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (pathsList.length > 1) {
        var currenPath = pathsList.shift();
        if (Object.keys(this.submodules).indexOf(currenPath) !== -1) {
          var _submodules$currenPat;

          return (_submodules$currenPat = this.submodules[currenPath]).get.apply(_submodules$currenPat, [pathsList.join("/")].concat(args));
        } else {
          throw new Error(currenPath + ': Path not defiend');
        }
      } else {
        return this.setState.apply(this, [entirePath].concat(args));
      }
    }
  }, {
    key: "route",
    value: function route(entirePath, node) {
      var pathsList = entirePath.split("/");
      if (pathsList.length > 1) {
        throw new Error('Please use a sub router module to add nested paths');
      }
      if (node.routable) {
        this.submodules[entirePath] = node;
      } else {
        this.setStateCallback(entirePath, node);
      }
      return this;
    }
  }]);

  return Router;
}(StateMachine);

module.exports = Router;

},{"./statemachine":"/Users/unifyid/hacks/picklebook/extension/src/js/statemachine.js"}],"/Users/unifyid/hacks/picklebook/extension/src/js/shortlived.js":[function(require,module,exports){
'use strict';

var Router = require('./router');
var ports = require('./ports');

var router = new Router();

var activated = false;

router.route('getState', function (request, sender, sendResponse) {
  console.log('getState requested: ' + activated);
  sendResponse({ activated: activated });
}).route('activate', function (request, sender, sendResponse) {
  activated = true;
  console.log('Setting state to ' + activated);
  ports.getPort('contentScript').then(function (value) {
    if (value) {
      console.log('Content script was loaded');
      value.postMessage({ message: 'activate' });
    } else {
      console.log('Content script was not loaded');
    }
  });

  // chrome.tabs.executeScript(sender.tab.tabId, `console.log($("a:contains('Like')"));`);

}).route('deactivate', function () {
  activated = false;
  console.log('Setting state to ' + activated);
  ports.getPort('contentScript').then(function (value) {
    if (value) {
      console.log('Content script was loaded');
      value.postMessage({ message: 'deactivate' });
    } else {
      console.log('Content script was not loaded');
    }
  });
});

module.exports = router;

},{"./ports":"/Users/unifyid/hacks/picklebook/extension/src/js/ports.js","./router":"/Users/unifyid/hacks/picklebook/extension/src/js/router.js"}],"/Users/unifyid/hacks/picklebook/extension/src/js/statemachine.js":[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Simple state machine because angular is hard to manage and I miss react.
*/
var StateMachine = function () {
  function StateMachine() {
    _classCallCheck(this, StateMachine);

    var self = this;
    self.state = '';
    self.statesCallbacks = {};
    self.previousState = '';
    self.errorCallback = function (state) {
      throw new Error("State " + state + " does not exist");
    };
    self.afterHook = function (state) {};
  }

  _createClass(StateMachine, [{
    key: 'setState',
    value: function setState(newState) {
      var self = this;
      if (self.state != '') {
        self.previousState = self.state;
      }
      self.state = newState;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      self.goToState.apply(self, args);
      return self;
    }
  }, {
    key: 'getState',
    value: function getState() {
      return this.state;
    }
  }, {
    key: 'getPreviousState',
    value: function getPreviousState() {
      return this.previousState;
    }
  }, {
    key: 'setCleanCallback',
    value: function setCleanCallback(callback) {
      var self = this;
      self.cleanCallback = callback;
      return self;
    }
  }, {
    key: 'clean',
    value: function clean() {
      this.cleanCallback();
      return this;
    }
  }, {
    key: 'exists',
    value: function exists(F) {
      return F !== null && F !== undefined;
    }
  }, {
    key: 'setErrorCallback',
    value: function setErrorCallback(callback) {
      var self = this;
      self.errorCallback = callback;
      return self;
    }
  }, {
    key: 'setAfterHook',
    value: function setAfterHook(callback) {
      var self = this;
      self.afterHook = callback;
      return self;
    }
  }, {
    key: 'goToState',
    value: function goToState() {
      var self = this;
      if (self.exists(self.cleanCallback)) {
        self.cleanCallback();
      }
      var F = self.statesCallbacks[self.state];
      if (self.exists(F)) {
        F.apply(undefined, arguments);
      } else {
        self.errorCallback(self.state);
      }
      self.afterHook(self.state);
      return self;
    }
  }, {
    key: 'setStateCallback',
    value: function setStateCallback(state, callback) {
      var self = this;
      self.statesCallbacks[state] = callback;
      return self;
    }
  }]);

  return StateMachine;
}();

module.exports = StateMachine;

},{}]},{},["/Users/unifyid/hacks/picklebook/extension/src/js/background.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYmFja2dyb3VuZC5qcyIsInNyYy9qcy9sb25nbGl2ZWQuanMiLCJzcmMvanMvcG9ydHMuanMiLCJzcmMvanMvcm91dGVyLmpzIiwic3JjL2pzL3Nob3J0bGl2ZWQuanMiLCJzcmMvanMvc3RhdGVtYWNoaW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFNLHNCQUFzQixRQUFRLGFBQVIsQ0FBNUI7QUFDQSxJQUFNLHdCQUF3QixRQUFRLGNBQVIsQ0FBOUI7O0FBRUE7OztBQUdBLE9BQU8sT0FBUCxDQUFlLFNBQWYsQ0FBeUIsV0FBekIsQ0FBcUMsVUFBUyxJQUFULEVBQWU7QUFDbEQsUUFBTSxPQUFOLENBQWMsS0FBSyxJQUFuQixFQUF5QixJQUF6QjtBQUNBLE9BQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsVUFBUyxPQUFULEVBQWtCLE1BQWxCLEVBQTBCLFlBQTFCLEVBQXdDO0FBQ2pFLGVBQVcsWUFBTTtBQUNmLDBCQUFvQixHQUFwQixDQUF3QixRQUFRLE9BQWhDLEVBQXlDLElBQXpDLEVBQStDLE9BQS9DLEVBQXdELFlBQXhEO0FBQ0QsS0FGRCxFQUVHLENBRkg7QUFHQTtBQUNBLFdBQU8sSUFBUDtBQUNELEdBTkQ7QUFPRCxDQVREOztBQVlBOzs7QUFHQSxPQUFPLE9BQVAsQ0FBZSxTQUFmLENBQXlCLFdBQXpCLENBQXFDLFVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQixZQUEzQixFQUF5QztBQUM1RSxhQUFXLFlBQU07QUFDZiwwQkFBc0IsR0FBdEIsQ0FBMEIsUUFBUSxPQUFsQyxFQUEyQyxPQUEzQyxFQUFvRCxNQUFwRCxFQUE0RCxZQUE1RDtBQUNELEdBRkQsRUFFRyxDQUZIO0FBR0E7QUFDQSxTQUFPLElBQVA7QUFDRCxDQU5EOzs7QUN0QkE7QUFDQTs7OztBQ0RBOzs7OztBQUtBLElBQUksaUJBQWlCLElBQXJCO0FBQ0EsSUFBSSxpQkFBaUIsSUFBckI7QUFDQSxJQUFJLG9CQUFvQixJQUF4QjtBQUNBLElBQUkscUJBQXFCLElBQXpCOztBQUVBLElBQUksZUFBZSxFQUFuQjtBQUNBLElBQUksV0FBVyxFQUFmOztBQUdBLElBQUksa0JBQWtCO0FBQ3BCLGNBQVksRUFEUTtBQUVwQixpQkFBZSxFQUZLO0FBR3BCLE9BQUssRUFIZTtBQUlwQixrQkFBZ0IsRUFKSTtBQUtwQixpQkFBZSxFQUxLO0FBTXBCLGtCQUFnQjtBQU5JLENBQXRCOztBQVNBLElBQUksVUFBVTtBQUNaLGNBQVksb0JBQVMsSUFBVCxFQUFlO0FBQ3pCLHFCQUFpQixJQUFqQjtBQUNELEdBSFc7QUFJWixpQkFBZSx1QkFBUyxJQUFULEVBQWUsS0FBZixFQUFzQjtBQUNuQyxpQkFBYSxLQUFiLElBQXNCLElBQXRCO0FBQ0QsR0FOVztBQU9aLE9BQUssYUFBUyxJQUFULEVBQWUsS0FBZixFQUFzQjtBQUN6QixhQUFTLEtBQVQsSUFBa0IsSUFBbEI7QUFDRCxHQVRXO0FBVVosa0JBQWdCLHdCQUFTLElBQVQsRUFBZTtBQUM3QixxQkFBaUIsSUFBakI7QUFDRCxHQVpXO0FBYVosaUJBQWUsdUJBQVMsSUFBVCxFQUFlO0FBQzVCLHdCQUFvQixJQUFwQjtBQUNELEdBZlc7QUFnQlosa0JBQWdCLHdCQUFTLElBQVQsRUFBZTtBQUM3Qix5QkFBcUIsSUFBckI7QUFDRDtBQWxCVyxDQUFkOztBQXFCQSxJQUFJLFVBQVU7QUFDWixjQUFZLHNCQUFXO0FBQ3JCLFdBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxjQUFRLGNBQVI7QUFDRCxLQUZNLENBQVA7QUFHRCxHQUxXO0FBTVosaUJBQWUsdUJBQVMsR0FBVCxFQUFjO0FBQzNCLFdBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxVQUFHLENBQUMsR0FBSixFQUFTO0FBQ1AsZUFBTyxJQUFQLENBQVksS0FBWixDQUFrQixFQUFDLFFBQVEsSUFBVCxFQUFlLGVBQWUsSUFBOUIsRUFBbEIsRUFBdUQsVUFBUyxJQUFULEVBQWU7QUFDcEUsY0FBSSxDQUFDLElBQUQsSUFBUyxLQUFLLE1BQUwsSUFBZSxDQUE1QixFQUErQjtBQUM3QixtQkFBTyw4QkFBUDtBQUNBO0FBQ0Q7QUFDRCxrQkFBUSxhQUFhLEtBQUssQ0FBTCxFQUFRLEVBQXJCLENBQVI7QUFDRCxTQU5EO0FBT0QsT0FSRCxNQVFPO0FBQ0wsZ0JBQVEsYUFBYSxJQUFJLEVBQWpCLENBQVI7QUFDRDtBQUNGLEtBWk0sQ0FBUDtBQWFELEdBcEJXO0FBcUJaLE9BQUssYUFBUyxHQUFULEVBQWM7QUFDakIsV0FBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFVBQUcsQ0FBQyxHQUFKLEVBQVM7QUFDUCxlQUFPLElBQVAsQ0FBWSxLQUFaLENBQWtCLEVBQUMsUUFBUSxJQUFULEVBQWUsZUFBZSxJQUE5QixFQUFsQixFQUF1RCxVQUFTLElBQVQsRUFBZTtBQUNwRSxjQUFJLENBQUMsSUFBRCxJQUFTLEtBQUssTUFBTCxJQUFlLENBQTVCLEVBQStCO0FBQzdCLG1CQUFPLHFCQUFQO0FBQ0E7QUFDRDtBQUNELGtCQUFRLEVBQUUsTUFBTSxTQUFTLEtBQUssQ0FBTCxFQUFRLEVBQWpCLENBQVIsRUFBOEIsS0FBSyxLQUFLLENBQUwsQ0FBbkMsRUFBUjtBQUNELFNBTkQ7QUFPRCxPQVJELE1BUU87QUFDTCxnQkFBUSxFQUFFLE1BQU0sU0FBUyxJQUFJLEVBQWIsQ0FBUixFQUEwQixRQUExQixFQUFSO0FBQ0Q7QUFDRixLQVpNLENBQVA7QUFhRCxHQW5DVztBQW9DWixrQkFBZ0IsMEJBQVc7QUFDekIsV0FBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLGNBQVEsY0FBUjtBQUNELEtBRk0sQ0FBUDtBQUdELEdBeENXO0FBeUNaLGlCQUFlLHlCQUFXO0FBQ3hCLFdBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxjQUFRLGlCQUFSO0FBQ0QsS0FGTSxDQUFQO0FBR0QsR0E3Q1c7QUE4Q1osa0JBQWdCLDBCQUFXO0FBQ3pCLFdBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFxQjtBQUN0QyxjQUFRLGtCQUFSO0FBQ0QsS0FGTSxDQUFQO0FBR0Q7QUFsRFcsQ0FBZDs7QUFxREEsSUFBSSxXQUFXO0FBQ2IsV0FBUyxpQkFBUyxJQUFULEVBQWUsSUFBZixFQUFxQjtBQUM1QixRQUFLLE9BQU8sSUFBUCxDQUFZLE9BQVosRUFBcUIsT0FBckIsQ0FBNkIsSUFBN0IsS0FBc0MsQ0FBQyxDQUE1QyxFQUErQztBQUM3QyxjQUFRLEdBQVIsQ0FBWSx5QkFBWjtBQUNBO0FBQ0Q7QUFDRCxRQUFJLENBQUMsSUFBTCxFQUFXO0FBQ1QsY0FBUSxHQUFSLENBQVkscUJBQVo7QUFDQTtBQUNEO0FBQ0QsUUFBSSxRQUFRLElBQVo7QUFDQSxRQUFJLEtBQUssTUFBTCxJQUFlLEtBQUssTUFBTCxDQUFZLEdBQS9CLEVBQW9DO0FBQ2xDLGNBQVEsS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixFQUF4QjtBQUNEO0FBQ0QsWUFBUSxJQUFSLEVBQWMsSUFBZCxFQUFvQixLQUFwQjtBQUNBLFNBQUssWUFBTCxDQUFrQixXQUFsQixDQUE4QixZQUFNO0FBQ2xDLGNBQVEsSUFBUixFQUFjLElBQWQsRUFBb0IsS0FBcEI7QUFDRCxLQUZEO0FBR0Esb0JBQWdCLElBQWhCLEVBQXNCLE9BQXRCLENBQThCLFVBQUMsUUFBRCxFQUFjO0FBQzFDO0FBQ0QsS0FGRDtBQUdELEdBckJZO0FBc0JiLFdBQVMsaUJBQVMsSUFBVCxFQUFlLEdBQWYsRUFBb0I7QUFDM0IsUUFBSyxPQUFPLElBQVAsQ0FBWSxPQUFaLEVBQXFCLE9BQXJCLENBQTZCLElBQTdCLEtBQXNDLENBQUMsQ0FBNUMsRUFBK0M7QUFDN0MsY0FBUSxHQUFSLENBQVkseUJBQVo7QUFDQTtBQUNEO0FBQ0QsV0FBTyxRQUFRLElBQVIsRUFBYyxHQUFkLENBQVA7QUFDRCxHQTVCWTtBQTZCYjs7O0FBR0EsZUFBYSxxQkFBUyxJQUFULEVBQWU7QUFDMUIsV0FBTyxRQUFQO0FBQ0QsR0FsQ1k7QUFtQ2I7OztBQUdBLHlCQUF1QiwrQkFBUyxJQUFULEVBQWU7QUFDcEMsV0FBTyxZQUFQO0FBQ0QsR0F4Q1k7QUF5Q2IsZUFBYSxxQkFBUyxJQUFULEVBQWUsUUFBZixFQUF5QjtBQUNwQyxRQUFLLE9BQU8sSUFBUCxDQUFZLGVBQVosRUFBNkIsT0FBN0IsQ0FBcUMsSUFBckMsS0FBOEMsQ0FBQyxDQUFwRCxFQUF1RDtBQUNyRCxjQUFRLEdBQVIsQ0FBWSx5QkFBWjtBQUNBO0FBQ0Q7QUFDRCxvQkFBZ0IsSUFBaEIsRUFBc0IsSUFBdEIsQ0FBMkIsUUFBM0I7QUFDRDtBQS9DWSxDQUFmOztBQWtEQSxPQUFPLE9BQVAsR0FBaUIsUUFBakI7Ozs7Ozs7Ozs7Ozs7QUNuSkEsSUFBTSxlQUFlLFFBQVEsZ0JBQVIsQ0FBckI7O0lBRU0sTTs7O0FBQ0osb0JBQWU7QUFBQTs7QUFBQTs7QUFFYixVQUFLLFFBQUwsR0FBZ0IsSUFBaEI7QUFDQSxVQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFIYTtBQUlkOzs7O3dCQUVJLFUsRUFBcUI7QUFDeEIsVUFBSSxZQUFZLFdBQVcsS0FBWCxDQUFpQixHQUFqQixDQUFoQjs7QUFEd0Isd0NBQU4sSUFBTTtBQUFOLFlBQU07QUFBQTs7QUFFeEIsVUFBRyxVQUFVLE1BQVYsR0FBbUIsQ0FBdEIsRUFBeUI7QUFDdkIsWUFBTSxhQUFhLFVBQVUsS0FBVixFQUFuQjtBQUNBLFlBQUssT0FBTyxJQUFQLENBQVksS0FBSyxVQUFqQixFQUE2QixPQUE3QixDQUFxQyxVQUFyQyxNQUFxRCxDQUFDLENBQTNELEVBQStEO0FBQUE7O0FBQzdELGlCQUFPLDhCQUFLLFVBQUwsQ0FBZ0IsVUFBaEIsR0FBNEIsR0FBNUIsK0JBQWdDLFVBQVUsSUFBVixDQUFlLEdBQWYsQ0FBaEMsU0FBd0QsSUFBeEQsRUFBUDtBQUNELFNBRkQsTUFFTztBQUNMLGdCQUFNLElBQUksS0FBSixDQUFVLGFBQVcsb0JBQXJCLENBQU47QUFDRDtBQUNGLE9BUEQsTUFPTztBQUNMLGVBQU8sS0FBSyxRQUFMLGNBQWMsVUFBZCxTQUE2QixJQUE3QixFQUFQO0FBQ0Q7QUFDRjs7OzBCQUVNLFUsRUFBWSxJLEVBQU07QUFDdkIsVUFBSSxZQUFZLFdBQVcsS0FBWCxDQUFpQixHQUFqQixDQUFoQjtBQUNBLFVBQUcsVUFBVSxNQUFWLEdBQW1CLENBQXRCLEVBQXlCO0FBQ3ZCLGNBQU0sSUFBSSxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEO0FBQ0QsVUFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDakIsYUFBSyxVQUFMLENBQWdCLFVBQWhCLElBQThCLElBQTlCO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsYUFBSyxnQkFBTCxDQUFzQixVQUF0QixFQUFrQyxJQUFsQztBQUNEO0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7Ozs7RUFoQ2tCLFk7O0FBbUNyQixPQUFPLE9BQVAsR0FBaUIsTUFBakI7Ozs7O0FDckNBLElBQU0sU0FBUyxRQUFRLFVBQVIsQ0FBZjtBQUNBLElBQU0sUUFBUSxRQUFRLFNBQVIsQ0FBZDs7QUFFQSxJQUFNLFNBQVMsSUFBSSxNQUFKLEVBQWY7O0FBRUEsSUFBSSxZQUFZLEtBQWhCOztBQUVBLE9BQU8sS0FBUCxDQUFhLFVBQWIsRUFBeUIsVUFBQyxPQUFELEVBQVUsTUFBVixFQUFrQixZQUFsQixFQUFtQztBQUMxRCxVQUFRLEdBQVIsMEJBQW1DLFNBQW5DO0FBQ0EsZUFBYSxFQUFFLG9CQUFGLEVBQWI7QUFDRCxDQUhELEVBSUMsS0FKRCxDQUlPLFVBSlAsRUFJbUIsVUFBQyxPQUFELEVBQVUsTUFBVixFQUFrQixZQUFsQixFQUFtQztBQUNwRCxjQUFZLElBQVo7QUFDQSxVQUFRLEdBQVIsdUJBQWdDLFNBQWhDO0FBQ0EsUUFBTSxPQUFOLENBQWMsZUFBZCxFQUErQixJQUEvQixDQUFxQyxVQUFDLEtBQUQsRUFBVztBQUM5QyxRQUFJLEtBQUosRUFBVztBQUNULGNBQVEsR0FBUixDQUFZLDJCQUFaO0FBQ0EsWUFBTSxXQUFOLENBQWtCLEVBQUUsU0FBUyxVQUFYLEVBQWxCO0FBQ0QsS0FIRCxNQUdPO0FBQ0wsY0FBUSxHQUFSLENBQVksK0JBQVo7QUFDRDtBQUNGLEdBUEQ7O0FBVUE7O0FBSUQsQ0FyQkQsRUFzQkMsS0F0QkQsQ0FzQk8sWUF0QlAsRUFzQnFCLFlBQU07QUFDMUIsY0FBWSxLQUFaO0FBQ0EsVUFBUSxHQUFSLHVCQUFnQyxTQUFoQztBQUNFLFFBQU0sT0FBTixDQUFjLGVBQWQsRUFBK0IsSUFBL0IsQ0FBcUMsVUFBQyxLQUFELEVBQVc7QUFDL0MsUUFBSSxLQUFKLEVBQVc7QUFDVCxjQUFRLEdBQVIsQ0FBWSwyQkFBWjtBQUNBLFlBQU0sV0FBTixDQUFrQixFQUFFLFNBQVMsWUFBWCxFQUFsQjtBQUNELEtBSEQsTUFHTztBQUNMLGNBQVEsR0FBUixDQUFZLCtCQUFaO0FBQ0Q7QUFDRixHQVBBO0FBUUYsQ0FqQ0Q7O0FBb0NBLE9BQU8sT0FBUCxHQUFpQixNQUFqQjs7Ozs7Ozs7O0FDM0NBOzs7SUFHTSxZO0FBQ0osMEJBQWU7QUFBQTs7QUFDYixRQUFJLE9BQU8sSUFBWDtBQUNBLFNBQUssS0FBTCxHQUFhLEVBQWI7QUFDQSxTQUFLLGVBQUwsR0FBdUIsRUFBdkI7QUFDQSxTQUFLLGFBQUwsR0FBcUIsRUFBckI7QUFDQSxTQUFLLGFBQUwsR0FBcUIsVUFBQyxLQUFELEVBQVc7QUFDOUIsWUFBTSxJQUFJLEtBQUosQ0FBVSxXQUFTLEtBQVQsR0FBZSxpQkFBekIsQ0FBTjtBQUNELEtBRkQ7QUFHQSxTQUFLLFNBQUwsR0FBaUIsVUFBQyxLQUFELEVBQVcsQ0FBRSxDQUE5QjtBQUNEOzs7OzZCQUVTLFEsRUFBbUI7QUFDM0IsVUFBSSxPQUFPLElBQVg7QUFDQSxVQUFJLEtBQUssS0FBTCxJQUFjLEVBQWxCLEVBQXNCO0FBQ3BCLGFBQUssYUFBTCxHQUFxQixLQUFLLEtBQTFCO0FBQ0Q7QUFDRCxXQUFLLEtBQUwsR0FBYSxRQUFiOztBQUwyQix3Q0FBTixJQUFNO0FBQU4sWUFBTTtBQUFBOztBQU0zQixXQUFLLFNBQUwsYUFBa0IsSUFBbEI7QUFDQSxhQUFPLElBQVA7QUFDRDs7OytCQUVXO0FBQ1YsYUFBTyxLQUFLLEtBQVo7QUFDRDs7O3VDQUVtQjtBQUNsQixhQUFPLEtBQUssYUFBWjtBQUNEOzs7cUNBRWlCLFEsRUFBVTtBQUMxQixVQUFJLE9BQU8sSUFBWDtBQUNBLFdBQUssYUFBTCxHQUFxQixRQUFyQjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7NEJBRVE7QUFDUCxXQUFLLGFBQUw7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzJCQUVPLEMsRUFBRztBQUNULGFBQVEsTUFBSyxJQUFOLElBQWdCLE1BQU0sU0FBN0I7QUFDRDs7O3FDQUVpQixRLEVBQVU7QUFDMUIsVUFBSSxPQUFPLElBQVg7QUFDQSxXQUFLLGFBQUwsR0FBcUIsUUFBckI7QUFDQSxhQUFPLElBQVA7QUFDRDs7O2lDQUVhLFEsRUFBVTtBQUN0QixVQUFJLE9BQU8sSUFBWDtBQUNBLFdBQUssU0FBTCxHQUFpQixRQUFqQjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Z0NBRW1CO0FBQ2xCLFVBQUksT0FBTyxJQUFYO0FBQ0EsVUFBRyxLQUFLLE1BQUwsQ0FBWSxLQUFLLGFBQWpCLENBQUgsRUFBb0M7QUFDbEMsYUFBSyxhQUFMO0FBQ0Q7QUFDRCxVQUFJLElBQUksS0FBSyxlQUFMLENBQXFCLEtBQUssS0FBMUIsQ0FBUjtBQUNBLFVBQUksS0FBSyxNQUFMLENBQVksQ0FBWixDQUFKLEVBQW9CO0FBQ2xCO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsYUFBSyxhQUFMLENBQW1CLEtBQUssS0FBeEI7QUFDRDtBQUNELFdBQUssU0FBTCxDQUFlLEtBQUssS0FBcEI7QUFDQSxhQUFPLElBQVA7QUFDRDs7O3FDQUVpQixLLEVBQU8sUSxFQUFVO0FBQ2pDLFVBQUksT0FBTyxJQUFYO0FBQ0EsV0FBSyxlQUFMLENBQXFCLEtBQXJCLElBQThCLFFBQTlCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztBQUdILE9BQU8sT0FBUCxHQUFpQixZQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBwb3J0cyA9IHJlcXVpcmUoJy4vcG9ydHMnKTtcbmNvbnN0IExvbmdMaXZlZENvbm5lY3Rpb24gPSByZXF1aXJlKCcuL2xvbmdsaXZlZCcpO1xuY29uc3QgU2hvcnRMaXZlZENvbm5lY3Rpb25zID0gcmVxdWlyZSgnLi9zaG9ydGxpdmVkJyk7XG5cbi8qKlxuKiBFdmVyeXRoaW5nIGJldHdlZW4gdGhlIGFuZ3VsYXIgYXBwIGFuZCB0aGUgYmFja2dyb3VuZCBzY3JpcHQuXG4qL1xuY2hyb21lLnJ1bnRpbWUub25Db25uZWN0LmFkZExpc3RlbmVyKGZ1bmN0aW9uKHBvcnQpIHtcbiAgcG9ydHMuc2V0UG9ydChwb3J0Lm5hbWUsIHBvcnQpO1xuICBwb3J0Lm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihmdW5jdGlvbihyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgTG9uZ0xpdmVkQ29ubmVjdGlvbi5nZXQocmVxdWVzdC5tZXNzYWdlLCBwb3J0LCByZXF1ZXN0LCBzZW5kUmVzcG9uc2UpO1xuICAgIH0sIDEpO1xuICAgIC8vIE5lY2Vzc2FyeSB0byByZXR1cm4gdHJ1ZSBmb3IgYXN5bmMgcmVzcG9uc2VzLlxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn0pO1xuXG5cbi8qKlxuICogQnVnIHJlcG9ydGluZyBzZWN0aW9uXG4gKi9cbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihmdW5jdGlvbiAocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgU2hvcnRMaXZlZENvbm5lY3Rpb25zLmdldChyZXF1ZXN0Lm1lc3NhZ2UsIHJlcXVlc3QsIHNlbmRlciwgc2VuZFJlc3BvbnNlKTtcbiAgfSwgMSk7XG4gIC8vIE5lY2Vzc2FyeSB0byByZXR1cm4gdHJ1ZSBmb3IgYXN5bmMgcmVzcG9uc2VzLlxuICByZXR1cm4gdHJ1ZTtcbn0pOyIsIlwidXNlIHN0cmljdFwiO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJaUlzSW1acGJHVWlPaUpzYjI1bmJHbDJaV1F1YW5NaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNlcxMTkiLCIvKlxuKiBOb3RlOiBBY2Nlc3NpbmcgdGhpcyBmcm9tIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdCBjb250ZXh0IGlzXG4qIGRpZmZlcmVudCB0aGFuIGFjY2Vzc2luZyB0aGlzIGZyb20gdGhlIGNvbnRlbnQgc2NyaXB0IGNvbnRleHQuXG4qL1xuXG5sZXQgYWN0aW9uUGFnZVBvcnQgPSBudWxsO1xubGV0IGJhY2tncm91bmRQb3J0ID0gbnVsbDtcbmxldCBwYXNzd29yZE1vZGFsUG9ydCA9IG51bGw7XG5sZXQgY2hhbGxlbmdlTW9kYWxQb3J0ID0gbnVsbDtcblxubGV0IGNvbnRlbnRQb3J0cyA9IHt9O1xubGV0IGFwcFBvcnRzID0ge307XG5cblxubGV0IGNoYW5nZUxpc3RlbmVycyA9IHtcbiAgYWN0aW9uUGFnZTogW10sXG4gIGNvbnRlbnRTY3JpcHQ6IFtdLFxuICBhcHA6IFtdLFxuICBiYWNrZ3JvdW5kUGFnZTogW10sXG4gIHBhc3N3b3JkTW9kYWw6IFtdLFxuICBjaGFsbGVuZ2VNb2RhbDogW11cbn07XG5cbmxldCBzZXR0ZXJzID0ge1xuICBhY3Rpb25QYWdlOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgYWN0aW9uUGFnZVBvcnQgPSBwb3J0O1xuICB9LFxuICBjb250ZW50U2NyaXB0OiBmdW5jdGlvbihwb3J0LCB0YWJJZCkge1xuICAgIGNvbnRlbnRQb3J0c1t0YWJJZF0gPSBwb3J0O1xuICB9LFxuICBhcHA6IGZ1bmN0aW9uKHBvcnQsIHRhYklkKSB7XG4gICAgYXBwUG9ydHNbdGFiSWRdID0gcG9ydDtcbiAgfSxcbiAgYmFja2dyb3VuZFBhZ2U6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBiYWNrZ3JvdW5kUG9ydCA9IHBvcnQ7XG4gIH0sXG4gIHBhc3N3b3JkTW9kYWw6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBwYXNzd29yZE1vZGFsUG9ydCA9IHBvcnQ7XG4gIH0sXG4gIGNoYWxsZW5nZU1vZGFsOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgY2hhbGxlbmdlTW9kYWxQb3J0ID0gcG9ydDtcbiAgfVxufTtcblxubGV0IGdldHRlcnMgPSB7XG4gIGFjdGlvblBhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKGFjdGlvblBhZ2VQb3J0KTtcbiAgICB9KTtcbiAgfSxcbiAgY29udGVudFNjcmlwdDogZnVuY3Rpb24odGFiKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmKCF0YWIpIHtcbiAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZX0sIGZ1bmN0aW9uKHRhYnMpIHtcbiAgICAgICAgICBpZiAoIXRhYnMgfHwgdGFicy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiTm8gY29udGVudCBzY3JpcHQgcG9ydCBmb3VuZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZShjb250ZW50UG9ydHNbdGFic1swXS5pZF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoY29udGVudFBvcnRzW3RhYi5pZF0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBhcHA6IGZ1bmN0aW9uKHRhYikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZighdGFiKSB7XG4gICAgICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWV9LCBmdW5jdGlvbih0YWJzKSB7XG4gICAgICAgICAgaWYgKCF0YWJzIHx8IHRhYnMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHJlamVjdCgnTm8gYWN0aXZlIHRhYiBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKHsgcG9ydDogYXBwUG9ydHNbdGFic1swXS5pZF0sIHRhYjogdGFic1swXSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKHsgcG9ydDogYXBwUG9ydHNbdGFiLmlkXSwgdGFiIH0pXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGJhY2tncm91bmRQYWdlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShiYWNrZ3JvdW5kUG9ydCk7XG4gICAgfSk7XG4gIH0sXG4gIHBhc3N3b3JkTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKHBhc3N3b3JkTW9kYWxQb3J0KTtcbiAgICB9KTtcbiAgfSxcbiAgY2hhbGxlbmdlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKGNoYWxsZW5nZU1vZGFsUG9ydCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbmxldCBQb3J0VXRpbCA9IHtcbiAgc2V0UG9ydDogZnVuY3Rpb24ocGFnZSwgcG9ydCkge1xuICAgIGlmICggT2JqZWN0LmtleXMoc2V0dGVycykuaW5kZXhPZihwYWdlKSA9PSAtMSApe1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgbmFtZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghcG9ydCkge1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgaXMgbm90IGRlZmluZWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHRhYklkID0gbnVsbDtcbiAgICBpZiAocG9ydC5zZW5kZXIgJiYgcG9ydC5zZW5kZXIudGFiKSB7XG4gICAgICB0YWJJZCA9IHBvcnQuc2VuZGVyLnRhYi5pZDtcbiAgICB9XG4gICAgc2V0dGVyc1twYWdlXShwb3J0LCB0YWJJZCk7XG4gICAgcG9ydC5vbkRpc2Nvbm5lY3QuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgICAgc2V0dGVyc1twYWdlXShudWxsLCB0YWJJZCk7XG4gICAgfSk7XG4gICAgY2hhbmdlTGlzdGVuZXJzW3BhZ2VdLmZvckVhY2goKGNhbGxiYWNrKSA9PiB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICB9LFxuICBnZXRQb3J0OiBmdW5jdGlvbihwYWdlLCB0YWIpIHtcbiAgICBpZiAoIE9iamVjdC5rZXlzKHNldHRlcnMpLmluZGV4T2YocGFnZSkgPT0gLTEgKXtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IG5hbWUgbm90IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0dGVyc1twYWdlXSh0YWIpO1xuICB9LFxuICAvKipcbiAgKiBSZXR1cm5zIGFsbCBhcHAgcG9ydHMuXG4gICovXG4gIGdldEFwcFBvcnRzOiBmdW5jdGlvbihwYWdlKSB7XG4gICAgcmV0dXJuIGFwcFBvcnRzO1xuICB9LFxuICAvKipcbiAgKiBSZXR1cm5zIGFsbCBjb250ZW50IHNjcmlwdCBwb3J0cy5cbiAgKi9cbiAgZ2V0Q29udGVudFNjcmlwdFBvcnRzOiBmdW5jdGlvbihwYWdlKSB7XG4gICAgcmV0dXJuIGNvbnRlbnRQb3J0cztcbiAgfSxcbiAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uKHBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCBPYmplY3Qua2V5cyhjaGFuZ2VMaXN0ZW5lcnMpLmluZGV4T2YocGFnZSkgPT0gLTEgKXtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IG5hbWUgbm90IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjaGFuZ2VMaXN0ZW5lcnNbcGFnZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQb3J0VXRpbDsiLCJjb25zdCBTdGF0ZU1hY2hpbmUgPSByZXF1aXJlKCcuL3N0YXRlbWFjaGluZScpO1xuXG5jbGFzcyBSb3V0ZXIgZXh0ZW5kcyBTdGF0ZU1hY2hpbmUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJvdXRhYmxlID0gdHJ1ZTtcbiAgICB0aGlzLnN1Ym1vZHVsZXMgPSB7fTtcbiAgfVxuXG4gIGdldCAoZW50aXJlUGF0aCwgLi4uYXJncykge1xuICAgIGxldCBwYXRoc0xpc3QgPSBlbnRpcmVQYXRoLnNwbGl0KFwiL1wiKTtcbiAgICBpZihwYXRoc0xpc3QubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3QgY3VycmVuUGF0aCA9IHBhdGhzTGlzdC5zaGlmdCgpO1xuICAgICAgaWYgKCBPYmplY3Qua2V5cyh0aGlzLnN1Ym1vZHVsZXMpLmluZGV4T2YoY3VycmVuUGF0aCkgIT09IC0xICkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJtb2R1bGVzW2N1cnJlblBhdGhdLmdldChwYXRoc0xpc3Quam9pbihcIi9cIiksIC4uLmFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGN1cnJlblBhdGgrJzogUGF0aCBub3QgZGVmaWVuZCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTdGF0ZShlbnRpcmVQYXRoLCAuLi5hcmdzKTtcbiAgICB9XG4gIH1cblxuICByb3V0ZSAoZW50aXJlUGF0aCwgbm9kZSkge1xuICAgIGxldCBwYXRoc0xpc3QgPSBlbnRpcmVQYXRoLnNwbGl0KFwiL1wiKTtcbiAgICBpZihwYXRoc0xpc3QubGVuZ3RoID4gMSApe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgdXNlIGEgc3ViIHJvdXRlciBtb2R1bGUgdG8gYWRkIG5lc3RlZCBwYXRocycpO1xuICAgIH1cbiAgICBpZiAobm9kZS5yb3V0YWJsZSkge1xuICAgICAgdGhpcy5zdWJtb2R1bGVzW2VudGlyZVBhdGhdID0gbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZXRTdGF0ZUNhbGxiYWNrKGVudGlyZVBhdGgsIG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcjsiLCJjb25zdCBSb3V0ZXIgPSByZXF1aXJlKCcuL3JvdXRlcicpO1xuY29uc3QgcG9ydHMgPSByZXF1aXJlKCcuL3BvcnRzJyk7XG5cbmNvbnN0IHJvdXRlciA9IG5ldyBSb3V0ZXIoKTtcblxubGV0IGFjdGl2YXRlZCA9IGZhbHNlO1xuXG5yb3V0ZXIucm91dGUoJ2dldFN0YXRlJywgKHJlcXVlc3QsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gIGNvbnNvbGUubG9nKGBnZXRTdGF0ZSByZXF1ZXN0ZWQ6ICR7YWN0aXZhdGVkfWApO1xuICBzZW5kUmVzcG9uc2UoeyBhY3RpdmF0ZWQgfSk7XG59KVxuLnJvdXRlKCdhY3RpdmF0ZScsIChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICBhY3RpdmF0ZWQgPSB0cnVlO1xuICBjb25zb2xlLmxvZyhgU2V0dGluZyBzdGF0ZSB0byAke2FjdGl2YXRlZH1gKTtcbiAgcG9ydHMuZ2V0UG9ydCgnY29udGVudFNjcmlwdCcpLnRoZW4oICh2YWx1ZSkgPT4ge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc29sZS5sb2coJ0NvbnRlbnQgc2NyaXB0IHdhcyBsb2FkZWQnKTtcbiAgICAgIHZhbHVlLnBvc3RNZXNzYWdlKHsgbWVzc2FnZTogJ2FjdGl2YXRlJyB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coJ0NvbnRlbnQgc2NyaXB0IHdhcyBub3QgbG9hZGVkJyk7XG4gICAgfVxuICB9KTtcblxuXG4gIC8vIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQoc2VuZGVyLnRhYi50YWJJZCwgYGNvbnNvbGUubG9nKCQoXCJhOmNvbnRhaW5zKCdMaWtlJylcIikpO2ApO1xuXG5cblxufSlcbi5yb3V0ZSgnZGVhY3RpdmF0ZScsICgpID0+IHtcblx0YWN0aXZhdGVkID0gZmFsc2U7XG5cdGNvbnNvbGUubG9nKGBTZXR0aW5nIHN0YXRlIHRvICR7YWN0aXZhdGVkfWApO1xuICAgcG9ydHMuZ2V0UG9ydCgnY29udGVudFNjcmlwdCcpLnRoZW4oICh2YWx1ZSkgPT4ge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc29sZS5sb2coJ0NvbnRlbnQgc2NyaXB0IHdhcyBsb2FkZWQnKTtcbiAgICAgIHZhbHVlLnBvc3RNZXNzYWdlKHsgbWVzc2FnZTogJ2RlYWN0aXZhdGUnIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnQ29udGVudCBzY3JpcHQgd2FzIG5vdCBsb2FkZWQnKTtcbiAgICB9XG4gIH0pO1xufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByb3V0ZXI7IiwiLyoqXG4qIFNpbXBsZSBzdGF0ZSBtYWNoaW5lIGJlY2F1c2UgYW5ndWxhciBpcyBoYXJkIHRvIG1hbmFnZSBhbmQgSSBtaXNzIHJlYWN0LlxuKi9cbmNsYXNzIFN0YXRlTWFjaGluZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zdGF0ZSA9ICcnO1xuICAgIHNlbGYuc3RhdGVzQ2FsbGJhY2tzID0ge307XG4gICAgc2VsZi5wcmV2aW91c1N0YXRlID0gJyc7XG4gICAgc2VsZi5lcnJvckNhbGxiYWNrID0gKHN0YXRlKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdGF0ZSBcIitzdGF0ZStcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICB9XG4gICAgc2VsZi5hZnRlckhvb2sgPSAoc3RhdGUpID0+IHt9O1xuICB9XG5cbiAgc2V0U3RhdGUgKG5ld1N0YXRlLCAuLi5hcmdzKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLnN0YXRlICE9ICcnKSB7XG4gICAgICBzZWxmLnByZXZpb3VzU3RhdGUgPSBzZWxmLnN0YXRlO1xuICAgIH1cbiAgICBzZWxmLnN0YXRlID0gbmV3U3RhdGU7XG4gICAgc2VsZi5nb1RvU3RhdGUoLi4uYXJncyk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBnZXRTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gIH1cblxuICBnZXRQcmV2aW91c1N0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcmV2aW91c1N0YXRlO1xuICB9XG5cbiAgc2V0Q2xlYW5DYWxsYmFjayAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5jbGVhbkNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBjbGVhbiAoKSB7XG4gICAgdGhpcy5jbGVhbkNhbGxiYWNrKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBleGlzdHMgKEYpIHtcbiAgICByZXR1cm4gKEYhPT0gbnVsbCkgJiYgKEYgIT09IHVuZGVmaW5lZCk7XG4gIH1cblxuICBzZXRFcnJvckNhbGxiYWNrIChjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmVycm9yQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIHNldEFmdGVySG9vayAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5hZnRlckhvb2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGdvVG9TdGF0ZSAoLi4uYXJncykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBpZihzZWxmLmV4aXN0cyhzZWxmLmNsZWFuQ2FsbGJhY2spKSB7XG4gICAgICBzZWxmLmNsZWFuQ2FsbGJhY2soKTtcbiAgICB9XG4gICAgbGV0IEYgPSBzZWxmLnN0YXRlc0NhbGxiYWNrc1tzZWxmLnN0YXRlXTtcbiAgICBpZiAoc2VsZi5leGlzdHMoRikpIHtcbiAgICAgIEYoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuZXJyb3JDYWxsYmFjayhzZWxmLnN0YXRlKTtcbiAgICB9XG4gICAgc2VsZi5hZnRlckhvb2soc2VsZi5zdGF0ZSk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBzZXRTdGF0ZUNhbGxiYWNrIChzdGF0ZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zdGF0ZXNDYWxsYmFja3Nbc3RhdGVdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZU1hY2hpbmU7Il19
