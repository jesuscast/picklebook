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
}).route('activate', function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYmFja2dyb3VuZC5qcyIsInNyYy9qcy9sb25nbGl2ZWQuanMiLCJzcmMvanMvcG9ydHMuanMiLCJzcmMvanMvcm91dGVyLmpzIiwic3JjL2pzL3Nob3J0bGl2ZWQuanMiLCJzcmMvanMvc3RhdGVtYWNoaW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFNLHNCQUFzQixRQUFRLGFBQVIsQ0FBNUI7QUFDQSxJQUFNLHdCQUF3QixRQUFRLGNBQVIsQ0FBOUI7O0FBRUE7OztBQUdBLE9BQU8sT0FBUCxDQUFlLFNBQWYsQ0FBeUIsV0FBekIsQ0FBcUMsVUFBUyxJQUFULEVBQWU7QUFDbEQsUUFBTSxPQUFOLENBQWMsS0FBSyxJQUFuQixFQUF5QixJQUF6QjtBQUNBLE9BQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsVUFBUyxPQUFULEVBQWtCLE1BQWxCLEVBQTBCLFlBQTFCLEVBQXdDO0FBQ2pFLGVBQVcsWUFBTTtBQUNmLDBCQUFvQixHQUFwQixDQUF3QixRQUFRLE9BQWhDLEVBQXlDLElBQXpDLEVBQStDLE9BQS9DLEVBQXdELFlBQXhEO0FBQ0QsS0FGRCxFQUVHLENBRkg7QUFHQTtBQUNBLFdBQU8sSUFBUDtBQUNELEdBTkQ7QUFPRCxDQVREOztBQVlBOzs7QUFHQSxPQUFPLE9BQVAsQ0FBZSxTQUFmLENBQXlCLFdBQXpCLENBQXFDLFVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQixZQUEzQixFQUF5QztBQUM1RSxhQUFXLFlBQU07QUFDZiwwQkFBc0IsR0FBdEIsQ0FBMEIsUUFBUSxPQUFsQyxFQUEyQyxPQUEzQyxFQUFvRCxNQUFwRCxFQUE0RCxZQUE1RDtBQUNELEdBRkQsRUFFRyxDQUZIO0FBR0E7QUFDQSxTQUFPLElBQVA7QUFDRCxDQU5EOzs7QUN0QkE7QUFDQTs7OztBQ0RBOzs7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aUIsWUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgcG9ydHMgPSByZXF1aXJlKCcuL3BvcnRzJyk7XG5jb25zdCBMb25nTGl2ZWRDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9sb25nbGl2ZWQnKTtcbmNvbnN0IFNob3J0TGl2ZWRDb25uZWN0aW9ucyA9IHJlcXVpcmUoJy4vc2hvcnRsaXZlZCcpO1xuXG4vKipcbiogRXZlcnl0aGluZyBiZXR3ZWVuIHRoZSBhbmd1bGFyIGFwcCBhbmQgdGhlIGJhY2tncm91bmQgc2NyaXB0LlxuKi9cbmNocm9tZS5ydW50aW1lLm9uQ29ubmVjdC5hZGRMaXN0ZW5lcihmdW5jdGlvbihwb3J0KSB7XG4gIHBvcnRzLnNldFBvcnQocG9ydC5uYW1lLCBwb3J0KTtcbiAgcG9ydC5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoZnVuY3Rpb24ocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIExvbmdMaXZlZENvbm5lY3Rpb24uZ2V0KHJlcXVlc3QubWVzc2FnZSwgcG9ydCwgcmVxdWVzdCwgc2VuZFJlc3BvbnNlKTtcbiAgICB9LCAxKTtcbiAgICAvLyBOZWNlc3NhcnkgdG8gcmV0dXJuIHRydWUgZm9yIGFzeW5jIHJlc3BvbnNlcy5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59KTtcblxuXG4vKipcbiAqIEJ1ZyByZXBvcnRpbmcgc2VjdGlvblxuICovXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoZnVuY3Rpb24gKHJlcXVlc3QsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSB7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIFNob3J0TGl2ZWRDb25uZWN0aW9ucy5nZXQocmVxdWVzdC5tZXNzYWdlLCByZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSk7XG4gIH0sIDEpO1xuICAvLyBOZWNlc3NhcnkgdG8gcmV0dXJuIHRydWUgZm9yIGFzeW5jIHJlc3BvbnNlcy5cbiAgcmV0dXJuIHRydWU7XG59KTsiLCJcInVzZSBzdHJpY3RcIjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYlhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWlJc0ltWnBiR1VpT2lKc2IyNW5iR2wyWldRdWFuTWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXMTE5IiwiLypcbiogTm90ZTogQWNjZXNzaW5nIHRoaXMgZnJvbSB0aGUgYmFja2dyb3VuZCBzY3JpcHQgY29udGV4dCBpc1xuKiBkaWZmZXJlbnQgdGhhbiBhY2Nlc3NpbmcgdGhpcyBmcm9tIHRoZSBjb250ZW50IHNjcmlwdCBjb250ZXh0LlxuKi9cblxubGV0IGFjdGlvblBhZ2VQb3J0ID0gbnVsbDtcbmxldCBiYWNrZ3JvdW5kUG9ydCA9IG51bGw7XG5sZXQgcGFzc3dvcmRNb2RhbFBvcnQgPSBudWxsO1xubGV0IGNoYWxsZW5nZU1vZGFsUG9ydCA9IG51bGw7XG5cbmxldCBjb250ZW50UG9ydHMgPSB7fTtcbmxldCBhcHBQb3J0cyA9IHt9O1xuXG5cbmxldCBjaGFuZ2VMaXN0ZW5lcnMgPSB7XG4gIGFjdGlvblBhZ2U6IFtdLFxuICBjb250ZW50U2NyaXB0OiBbXSxcbiAgYXBwOiBbXSxcbiAgYmFja2dyb3VuZFBhZ2U6IFtdLFxuICBwYXNzd29yZE1vZGFsOiBbXSxcbiAgY2hhbGxlbmdlTW9kYWw6IFtdXG59O1xuXG5sZXQgc2V0dGVycyA9IHtcbiAgYWN0aW9uUGFnZTogZnVuY3Rpb24ocG9ydCkge1xuICAgIGFjdGlvblBhZ2VQb3J0ID0gcG9ydDtcbiAgfSxcbiAgY29udGVudFNjcmlwdDogZnVuY3Rpb24ocG9ydCwgdGFiSWQpIHtcbiAgICBjb250ZW50UG9ydHNbdGFiSWRdID0gcG9ydDtcbiAgfSxcbiAgYXBwOiBmdW5jdGlvbihwb3J0LCB0YWJJZCkge1xuICAgIGFwcFBvcnRzW3RhYklkXSA9IHBvcnQ7XG4gIH0sXG4gIGJhY2tncm91bmRQYWdlOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgYmFja2dyb3VuZFBvcnQgPSBwb3J0O1xuICB9LFxuICBwYXNzd29yZE1vZGFsOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgcGFzc3dvcmRNb2RhbFBvcnQgPSBwb3J0O1xuICB9LFxuICBjaGFsbGVuZ2VNb2RhbDogZnVuY3Rpb24ocG9ydCkge1xuICAgIGNoYWxsZW5nZU1vZGFsUG9ydCA9IHBvcnQ7XG4gIH1cbn07XG5cbmxldCBnZXR0ZXJzID0ge1xuICBhY3Rpb25QYWdlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShhY3Rpb25QYWdlUG9ydCk7XG4gICAgfSk7XG4gIH0sXG4gIGNvbnRlbnRTY3JpcHQ6IGZ1bmN0aW9uKHRhYikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZighdGFiKSB7XG4gICAgICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWV9LCBmdW5jdGlvbih0YWJzKSB7XG4gICAgICAgICAgaWYgKCF0YWJzIHx8IHRhYnMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHJlamVjdChcIk5vIGNvbnRlbnQgc2NyaXB0IHBvcnQgZm91bmRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoY29udGVudFBvcnRzW3RhYnNbMF0uaWRdKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKGNvbnRlbnRQb3J0c1t0YWIuaWRdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgYXBwOiBmdW5jdGlvbih0YWIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYoIXRhYikge1xuICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlfSwgZnVuY3Rpb24odGFicykge1xuICAgICAgICAgIGlmICghdGFicyB8fCB0YWJzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZWplY3QoJ05vIGFjdGl2ZSB0YWIgZm91bmQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZSh7IHBvcnQ6IGFwcFBvcnRzW3RhYnNbMF0uaWRdLCB0YWI6IHRhYnNbMF0gfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSh7IHBvcnQ6IGFwcFBvcnRzW3RhYi5pZF0sIHRhYiB9KVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBiYWNrZ3JvdW5kUGFnZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUoYmFja2dyb3VuZFBvcnQpO1xuICAgIH0pO1xuICB9LFxuICBwYXNzd29yZE1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShwYXNzd29yZE1vZGFsUG9ydCk7XG4gICAgfSk7XG4gIH0sXG4gIGNoYWxsZW5nZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShjaGFsbGVuZ2VNb2RhbFBvcnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG5sZXQgUG9ydFV0aWwgPSB7XG4gIHNldFBvcnQ6IGZ1bmN0aW9uKHBhZ2UsIHBvcnQpIHtcbiAgICBpZiAoIE9iamVjdC5rZXlzKHNldHRlcnMpLmluZGV4T2YocGFnZSkgPT0gLTEgKXtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IG5hbWUgbm90IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXBvcnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IGlzIG5vdCBkZWZpbmVkJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCB0YWJJZCA9IG51bGw7XG4gICAgaWYgKHBvcnQuc2VuZGVyICYmIHBvcnQuc2VuZGVyLnRhYikge1xuICAgICAgdGFiSWQgPSBwb3J0LnNlbmRlci50YWIuaWQ7XG4gICAgfVxuICAgIHNldHRlcnNbcGFnZV0ocG9ydCwgdGFiSWQpO1xuICAgIHBvcnQub25EaXNjb25uZWN0LmFkZExpc3RlbmVyKCgpID0+IHtcbiAgICAgIHNldHRlcnNbcGFnZV0obnVsbCwgdGFiSWQpO1xuICAgIH0pO1xuICAgIGNoYW5nZUxpc3RlbmVyc1twYWdlXS5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgfSxcbiAgZ2V0UG9ydDogZnVuY3Rpb24ocGFnZSwgdGFiKSB7XG4gICAgaWYgKCBPYmplY3Qua2V5cyhzZXR0ZXJzKS5pbmRleE9mKHBhZ2UpID09IC0xICl7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBuYW1lIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGdldHRlcnNbcGFnZV0odGFiKTtcbiAgfSxcbiAgLyoqXG4gICogUmV0dXJucyBhbGwgYXBwIHBvcnRzLlxuICAqL1xuICBnZXRBcHBQb3J0czogZnVuY3Rpb24ocGFnZSkge1xuICAgIHJldHVybiBhcHBQb3J0cztcbiAgfSxcbiAgLyoqXG4gICogUmV0dXJucyBhbGwgY29udGVudCBzY3JpcHQgcG9ydHMuXG4gICovXG4gIGdldENvbnRlbnRTY3JpcHRQb3J0czogZnVuY3Rpb24ocGFnZSkge1xuICAgIHJldHVybiBjb250ZW50UG9ydHM7XG4gIH0sXG4gIGFkZExpc3RlbmVyOiBmdW5jdGlvbihwYWdlLCBjYWxsYmFjaykge1xuICAgIGlmICggT2JqZWN0LmtleXMoY2hhbmdlTGlzdGVuZXJzKS5pbmRleE9mKHBhZ2UpID09IC0xICl7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBuYW1lIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2hhbmdlTGlzdGVuZXJzW3BhZ2VdLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUG9ydFV0aWw7IiwiY29uc3QgU3RhdGVNYWNoaW5lID0gcmVxdWlyZSgnLi9zdGF0ZW1hY2hpbmUnKTtcblxuY2xhc3MgUm91dGVyIGV4dGVuZHMgU3RhdGVNYWNoaW5lIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5yb3V0YWJsZSA9IHRydWU7XG4gICAgdGhpcy5zdWJtb2R1bGVzID0ge307XG4gIH1cblxuICBnZXQgKGVudGlyZVBhdGgsIC4uLmFyZ3MpIHtcbiAgICBsZXQgcGF0aHNMaXN0ID0gZW50aXJlUGF0aC5zcGxpdChcIi9cIik7XG4gICAgaWYocGF0aHNMaXN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IGN1cnJlblBhdGggPSBwYXRoc0xpc3Quc2hpZnQoKTtcbiAgICAgIGlmICggT2JqZWN0LmtleXModGhpcy5zdWJtb2R1bGVzKS5pbmRleE9mKGN1cnJlblBhdGgpICE9PSAtMSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VibW9kdWxlc1tjdXJyZW5QYXRoXS5nZXQocGF0aHNMaXN0LmpvaW4oXCIvXCIpLCAuLi5hcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihjdXJyZW5QYXRoKyc6IFBhdGggbm90IGRlZmllbmQnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoZW50aXJlUGF0aCwgLi4uYXJncyk7XG4gICAgfVxuICB9XG5cbiAgcm91dGUgKGVudGlyZVBhdGgsIG5vZGUpIHtcbiAgICBsZXQgcGF0aHNMaXN0ID0gZW50aXJlUGF0aC5zcGxpdChcIi9cIik7XG4gICAgaWYocGF0aHNMaXN0Lmxlbmd0aCA+IDEgKXtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHVzZSBhIHN1YiByb3V0ZXIgbW9kdWxlIHRvIGFkZCBuZXN0ZWQgcGF0aHMnKTtcbiAgICB9XG4gICAgaWYgKG5vZGUucm91dGFibGUpIHtcbiAgICAgIHRoaXMuc3VibW9kdWxlc1tlbnRpcmVQYXRoXSA9IG5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2V0U3RhdGVDYWxsYmFjayhlbnRpcmVQYXRoLCBub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb3V0ZXI7IiwiY29uc3QgUm91dGVyID0gcmVxdWlyZSgnLi9yb3V0ZXInKTtcbmNvbnN0IHBvcnRzID0gcmVxdWlyZSgnLi9wb3J0cycpO1xuXG5jb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG5cbmxldCBhY3RpdmF0ZWQgPSBmYWxzZTtcblxucm91dGVyLnJvdXRlKCdnZXRTdGF0ZScsIChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICBjb25zb2xlLmxvZyhgZ2V0U3RhdGUgcmVxdWVzdGVkOiAke2FjdGl2YXRlZH1gKTtcbiAgc2VuZFJlc3BvbnNlKHsgYWN0aXZhdGVkIH0pO1xufSlcbi5yb3V0ZSgnYWN0aXZhdGUnLCAoKSA9PiB7XG4gIGFjdGl2YXRlZCA9IHRydWU7XG4gIGNvbnNvbGUubG9nKGBTZXR0aW5nIHN0YXRlIHRvICR7YWN0aXZhdGVkfWApO1xuICBwb3J0cy5nZXRQb3J0KCdjb250ZW50U2NyaXB0JykudGhlbiggKHZhbHVlKSA9PiB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBjb25zb2xlLmxvZygnQ29udGVudCBzY3JpcHQgd2FzIGxvYWRlZCcpO1xuICAgICAgdmFsdWUucG9zdE1lc3NhZ2UoeyBtZXNzYWdlOiAnYWN0aXZhdGUnIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnQ29udGVudCBzY3JpcHQgd2FzIG5vdCBsb2FkZWQnKTtcbiAgICB9XG4gIH0pO1xufSlcbi5yb3V0ZSgnZGVhY3RpdmF0ZScsICgpID0+IHtcblx0YWN0aXZhdGVkID0gZmFsc2U7XG5cdGNvbnNvbGUubG9nKGBTZXR0aW5nIHN0YXRlIHRvICR7YWN0aXZhdGVkfWApO1xuICAgcG9ydHMuZ2V0UG9ydCgnY29udGVudFNjcmlwdCcpLnRoZW4oICh2YWx1ZSkgPT4ge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc29sZS5sb2coJ0NvbnRlbnQgc2NyaXB0IHdhcyBsb2FkZWQnKTtcbiAgICAgIHZhbHVlLnBvc3RNZXNzYWdlKHsgbWVzc2FnZTogJ2RlYWN0aXZhdGUnIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnQ29udGVudCBzY3JpcHQgd2FzIG5vdCBsb2FkZWQnKTtcbiAgICB9XG4gIH0pO1xufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByb3V0ZXI7IiwiLyoqXG4qIFNpbXBsZSBzdGF0ZSBtYWNoaW5lIGJlY2F1c2UgYW5ndWxhciBpcyBoYXJkIHRvIG1hbmFnZSBhbmQgSSBtaXNzIHJlYWN0LlxuKi9cbmNsYXNzIFN0YXRlTWFjaGluZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zdGF0ZSA9ICcnO1xuICAgIHNlbGYuc3RhdGVzQ2FsbGJhY2tzID0ge307XG4gICAgc2VsZi5wcmV2aW91c1N0YXRlID0gJyc7XG4gICAgc2VsZi5lcnJvckNhbGxiYWNrID0gKHN0YXRlKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdGF0ZSBcIitzdGF0ZStcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICB9XG4gICAgc2VsZi5hZnRlckhvb2sgPSAoc3RhdGUpID0+IHt9O1xuICB9XG5cbiAgc2V0U3RhdGUgKG5ld1N0YXRlLCAuLi5hcmdzKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLnN0YXRlICE9ICcnKSB7XG4gICAgICBzZWxmLnByZXZpb3VzU3RhdGUgPSBzZWxmLnN0YXRlO1xuICAgIH1cbiAgICBzZWxmLnN0YXRlID0gbmV3U3RhdGU7XG4gICAgc2VsZi5nb1RvU3RhdGUoLi4uYXJncyk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBnZXRTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gIH1cblxuICBnZXRQcmV2aW91c1N0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcmV2aW91c1N0YXRlO1xuICB9XG5cbiAgc2V0Q2xlYW5DYWxsYmFjayAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5jbGVhbkNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBjbGVhbiAoKSB7XG4gICAgdGhpcy5jbGVhbkNhbGxiYWNrKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBleGlzdHMgKEYpIHtcbiAgICByZXR1cm4gKEYhPT0gbnVsbCkgJiYgKEYgIT09IHVuZGVmaW5lZCk7XG4gIH1cblxuICBzZXRFcnJvckNhbGxiYWNrIChjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmVycm9yQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIHNldEFmdGVySG9vayAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5hZnRlckhvb2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGdvVG9TdGF0ZSAoLi4uYXJncykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBpZihzZWxmLmV4aXN0cyhzZWxmLmNsZWFuQ2FsbGJhY2spKSB7XG4gICAgICBzZWxmLmNsZWFuQ2FsbGJhY2soKTtcbiAgICB9XG4gICAgbGV0IEYgPSBzZWxmLnN0YXRlc0NhbGxiYWNrc1tzZWxmLnN0YXRlXTtcbiAgICBpZiAoc2VsZi5leGlzdHMoRikpIHtcbiAgICAgIEYoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuZXJyb3JDYWxsYmFjayhzZWxmLnN0YXRlKTtcbiAgICB9XG4gICAgc2VsZi5hZnRlckhvb2soc2VsZi5zdGF0ZSk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBzZXRTdGF0ZUNhbGxiYWNrIChzdGF0ZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zdGF0ZXNDYWxsYmFja3Nbc3RhdGVdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZU1hY2hpbmU7Il19
