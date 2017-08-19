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

router.route('hey', function (request, sender, sendResponse) {
  console.log('HEY WTF');
  sendResponse({ message: 'returnUser' });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYmFja2dyb3VuZC5qcyIsInNyYy9qcy9sb25nbGl2ZWQuanMiLCJzcmMvanMvcG9ydHMuanMiLCJzcmMvanMvcm91dGVyLmpzIiwic3JjL2pzL3Nob3J0bGl2ZWQuanMiLCJzcmMvanMvc3RhdGVtYWNoaW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFNLHNCQUFzQixRQUFRLGFBQVIsQ0FBNUI7QUFDQSxJQUFNLHdCQUF3QixRQUFRLGNBQVIsQ0FBOUI7O0FBRUE7OztBQUdBLE9BQU8sT0FBUCxDQUFlLFNBQWYsQ0FBeUIsV0FBekIsQ0FBcUMsVUFBUyxJQUFULEVBQWU7QUFDbEQsUUFBTSxPQUFOLENBQWMsS0FBSyxJQUFuQixFQUF5QixJQUF6QjtBQUNBLE9BQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkIsVUFBUyxPQUFULEVBQWtCLE1BQWxCLEVBQTBCLFlBQTFCLEVBQXdDO0FBQ2pFLGVBQVcsWUFBTTtBQUNmLDBCQUFvQixHQUFwQixDQUF3QixRQUFRLE9BQWhDLEVBQXlDLElBQXpDLEVBQStDLE9BQS9DLEVBQXdELFlBQXhEO0FBQ0QsS0FGRCxFQUVHLENBRkg7QUFHQTtBQUNBLFdBQU8sSUFBUDtBQUNELEdBTkQ7QUFPRCxDQVREOztBQVlBOzs7QUFHQSxPQUFPLE9BQVAsQ0FBZSxTQUFmLENBQXlCLFdBQXpCLENBQXFDLFVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQixZQUEzQixFQUF5QztBQUM1RSxhQUFXLFlBQU07QUFDZiwwQkFBc0IsR0FBdEIsQ0FBMEIsUUFBUSxPQUFsQyxFQUEyQyxPQUEzQyxFQUFvRCxNQUFwRCxFQUE0RCxZQUE1RDtBQUNELEdBRkQsRUFFRyxDQUZIO0FBR0E7QUFDQSxTQUFPLElBQVA7QUFDRCxDQU5EOzs7QUN0QkE7QUFDQTs7OztBQ0RBOzs7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cUIsS0FBSyxLQUExQixDQUFSO0FBQ0EsVUFBSSxLQUFLLE1BQUwsQ0FBWSxDQUFaLENBQUosRUFBb0I7QUFDbEI7QUFDRCxPQUZELE1BRU87QUFDTCxhQUFLLGFBQUwsQ0FBbUIsS0FBSyxLQUF4QjtBQUNEO0FBQ0QsV0FBSyxTQUFMLENBQWUsS0FBSyxLQUFwQjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7cUNBRWlCLEssRUFBTyxRLEVBQVU7QUFDakMsVUFBSSxPQUFPLElBQVg7QUFDQSxXQUFLLGVBQUwsQ0FBcUIsS0FBckIsSUFBOEIsUUFBOUI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O0FBR0gsT0FBTyxPQUFQLEdBQWlCLFlBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IHBvcnRzID0gcmVxdWlyZSgnLi9wb3J0cycpO1xuY29uc3QgTG9uZ0xpdmVkQ29ubmVjdGlvbiA9IHJlcXVpcmUoJy4vbG9uZ2xpdmVkJyk7XG5jb25zdCBTaG9ydExpdmVkQ29ubmVjdGlvbnMgPSByZXF1aXJlKCcuL3Nob3J0bGl2ZWQnKTtcblxuLyoqXG4qIEV2ZXJ5dGhpbmcgYmV0d2VlbiB0aGUgYW5ndWxhciBhcHAgYW5kIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdC5cbiovXG5jaHJvbWUucnVudGltZS5vbkNvbm5lY3QuYWRkTGlzdGVuZXIoZnVuY3Rpb24ocG9ydCkge1xuICBwb3J0cy5zZXRQb3J0KHBvcnQubmFtZSwgcG9ydCk7XG4gIHBvcnQub25NZXNzYWdlLmFkZExpc3RlbmVyKGZ1bmN0aW9uKHJlcXVlc3QsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBMb25nTGl2ZWRDb25uZWN0aW9uLmdldChyZXF1ZXN0Lm1lc3NhZ2UsIHBvcnQsIHJlcXVlc3QsIHNlbmRSZXNwb25zZSk7XG4gICAgfSwgMSk7XG4gICAgLy8gTmVjZXNzYXJ5IHRvIHJldHVybiB0cnVlIGZvciBhc3luYyByZXNwb25zZXMuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pO1xufSk7XG5cblxuLyoqXG4gKiBCdWcgcmVwb3J0aW5nIHNlY3Rpb25cbiAqL1xuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBTaG9ydExpdmVkQ29ubmVjdGlvbnMuZ2V0KHJlcXVlc3QubWVzc2FnZSwgcmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpO1xuICB9LCAxKTtcbiAgLy8gTmVjZXNzYXJ5IHRvIHJldHVybiB0cnVlIGZvciBhc3luYyByZXNwb25zZXMuXG4gIHJldHVybiB0cnVlO1xufSk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklpSXNJbVpwYkdVaU9pSnNiMjVuYkdsMlpXUXVhbk1pTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2VzExOSIsIi8qXG4qIE5vdGU6IEFjY2Vzc2luZyB0aGlzIGZyb20gdGhlIGJhY2tncm91bmQgc2NyaXB0IGNvbnRleHQgaXNcbiogZGlmZmVyZW50IHRoYW4gYWNjZXNzaW5nIHRoaXMgZnJvbSB0aGUgY29udGVudCBzY3JpcHQgY29udGV4dC5cbiovXG5cbmxldCBhY3Rpb25QYWdlUG9ydCA9IG51bGw7XG5sZXQgYmFja2dyb3VuZFBvcnQgPSBudWxsO1xubGV0IHBhc3N3b3JkTW9kYWxQb3J0ID0gbnVsbDtcbmxldCBjaGFsbGVuZ2VNb2RhbFBvcnQgPSBudWxsO1xuXG5sZXQgY29udGVudFBvcnRzID0ge307XG5sZXQgYXBwUG9ydHMgPSB7fTtcblxuXG5sZXQgY2hhbmdlTGlzdGVuZXJzID0ge1xuICBhY3Rpb25QYWdlOiBbXSxcbiAgY29udGVudFNjcmlwdDogW10sXG4gIGFwcDogW10sXG4gIGJhY2tncm91bmRQYWdlOiBbXSxcbiAgcGFzc3dvcmRNb2RhbDogW10sXG4gIGNoYWxsZW5nZU1vZGFsOiBbXVxufTtcblxubGV0IHNldHRlcnMgPSB7XG4gIGFjdGlvblBhZ2U6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBhY3Rpb25QYWdlUG9ydCA9IHBvcnQ7XG4gIH0sXG4gIGNvbnRlbnRTY3JpcHQ6IGZ1bmN0aW9uKHBvcnQsIHRhYklkKSB7XG4gICAgY29udGVudFBvcnRzW3RhYklkXSA9IHBvcnQ7XG4gIH0sXG4gIGFwcDogZnVuY3Rpb24ocG9ydCwgdGFiSWQpIHtcbiAgICBhcHBQb3J0c1t0YWJJZF0gPSBwb3J0O1xuICB9LFxuICBiYWNrZ3JvdW5kUGFnZTogZnVuY3Rpb24ocG9ydCkge1xuICAgIGJhY2tncm91bmRQb3J0ID0gcG9ydDtcbiAgfSxcbiAgcGFzc3dvcmRNb2RhbDogZnVuY3Rpb24ocG9ydCkge1xuICAgIHBhc3N3b3JkTW9kYWxQb3J0ID0gcG9ydDtcbiAgfSxcbiAgY2hhbGxlbmdlTW9kYWw6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBjaGFsbGVuZ2VNb2RhbFBvcnQgPSBwb3J0O1xuICB9XG59O1xuXG5sZXQgZ2V0dGVycyA9IHtcbiAgYWN0aW9uUGFnZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUoYWN0aW9uUGFnZVBvcnQpO1xuICAgIH0pO1xuICB9LFxuICBjb250ZW50U2NyaXB0OiBmdW5jdGlvbih0YWIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYoIXRhYikge1xuICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlfSwgZnVuY3Rpb24odGFicykge1xuICAgICAgICAgIGlmICghdGFicyB8fCB0YWJzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZWplY3QoXCJObyBjb250ZW50IHNjcmlwdCBwb3J0IGZvdW5kXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGNvbnRlbnRQb3J0c1t0YWJzWzBdLmlkXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShjb250ZW50UG9ydHNbdGFiLmlkXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGFwcDogZnVuY3Rpb24odGFiKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmKCF0YWIpIHtcbiAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZX0sIGZ1bmN0aW9uKHRhYnMpIHtcbiAgICAgICAgICBpZiAoIXRhYnMgfHwgdGFicy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmVqZWN0KCdObyBhY3RpdmUgdGFiIGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoeyBwb3J0OiBhcHBQb3J0c1t0YWJzWzBdLmlkXSwgdGFiOiB0YWJzWzBdIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoeyBwb3J0OiBhcHBQb3J0c1t0YWIuaWRdLCB0YWIgfSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgYmFja2dyb3VuZFBhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKGJhY2tncm91bmRQb3J0KTtcbiAgICB9KTtcbiAgfSxcbiAgcGFzc3dvcmRNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUocGFzc3dvcmRNb2RhbFBvcnQpO1xuICAgIH0pO1xuICB9LFxuICBjaGFsbGVuZ2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUoY2hhbGxlbmdlTW9kYWxQb3J0KTtcbiAgICB9KTtcbiAgfVxufTtcblxubGV0IFBvcnRVdGlsID0ge1xuICBzZXRQb3J0OiBmdW5jdGlvbihwYWdlLCBwb3J0KSB7XG4gICAgaWYgKCBPYmplY3Qua2V5cyhzZXR0ZXJzKS5pbmRleE9mKHBhZ2UpID09IC0xICl7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBuYW1lIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFwb3J0KSB7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBpcyBub3QgZGVmaW5lZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgdGFiSWQgPSBudWxsO1xuICAgIGlmIChwb3J0LnNlbmRlciAmJiBwb3J0LnNlbmRlci50YWIpIHtcbiAgICAgIHRhYklkID0gcG9ydC5zZW5kZXIudGFiLmlkO1xuICAgIH1cbiAgICBzZXR0ZXJzW3BhZ2VdKHBvcnQsIHRhYklkKTtcbiAgICBwb3J0Lm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICBzZXR0ZXJzW3BhZ2VdKG51bGwsIHRhYklkKTtcbiAgICB9KTtcbiAgICBjaGFuZ2VMaXN0ZW5lcnNbcGFnZV0uZm9yRWFjaCgoY2FsbGJhY2spID0+IHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH0sXG4gIGdldFBvcnQ6IGZ1bmN0aW9uKHBhZ2UsIHRhYikge1xuICAgIGlmICggT2JqZWN0LmtleXMoc2V0dGVycykuaW5kZXhPZihwYWdlKSA9PSAtMSApe1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgbmFtZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBnZXR0ZXJzW3BhZ2VdKHRhYik7XG4gIH0sXG4gIC8qKlxuICAqIFJldHVybnMgYWxsIGFwcCBwb3J0cy5cbiAgKi9cbiAgZ2V0QXBwUG9ydHM6IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICByZXR1cm4gYXBwUG9ydHM7XG4gIH0sXG4gIC8qKlxuICAqIFJldHVybnMgYWxsIGNvbnRlbnQgc2NyaXB0IHBvcnRzLlxuICAqL1xuICBnZXRDb250ZW50U2NyaXB0UG9ydHM6IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICByZXR1cm4gY29udGVudFBvcnRzO1xuICB9LFxuICBhZGRMaXN0ZW5lcjogZnVuY3Rpb24ocGFnZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIE9iamVjdC5rZXlzKGNoYW5nZUxpc3RlbmVycykuaW5kZXhPZihwYWdlKSA9PSAtMSApe1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgbmFtZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNoYW5nZUxpc3RlbmVyc1twYWdlXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvcnRVdGlsOyIsImNvbnN0IFN0YXRlTWFjaGluZSA9IHJlcXVpcmUoJy4vc3RhdGVtYWNoaW5lJyk7XG5cbmNsYXNzIFJvdXRlciBleHRlbmRzIFN0YXRlTWFjaGluZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucm91dGFibGUgPSB0cnVlO1xuICAgIHRoaXMuc3VibW9kdWxlcyA9IHt9O1xuICB9XG5cbiAgZ2V0IChlbnRpcmVQYXRoLCAuLi5hcmdzKSB7XG4gICAgbGV0IHBhdGhzTGlzdCA9IGVudGlyZVBhdGguc3BsaXQoXCIvXCIpO1xuICAgIGlmKHBhdGhzTGlzdC5sZW5ndGggPiAxKSB7XG4gICAgICBjb25zdCBjdXJyZW5QYXRoID0gcGF0aHNMaXN0LnNoaWZ0KCk7XG4gICAgICBpZiAoIE9iamVjdC5rZXlzKHRoaXMuc3VibW9kdWxlcykuaW5kZXhPZihjdXJyZW5QYXRoKSAhPT0gLTEgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1Ym1vZHVsZXNbY3VycmVuUGF0aF0uZ2V0KHBhdGhzTGlzdC5qb2luKFwiL1wiKSwgLi4uYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoY3VycmVuUGF0aCsnOiBQYXRoIG5vdCBkZWZpZW5kJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFN0YXRlKGVudGlyZVBhdGgsIC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJvdXRlIChlbnRpcmVQYXRoLCBub2RlKSB7XG4gICAgbGV0IHBhdGhzTGlzdCA9IGVudGlyZVBhdGguc3BsaXQoXCIvXCIpO1xuICAgIGlmKHBhdGhzTGlzdC5sZW5ndGggPiAxICl7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSB1c2UgYSBzdWIgcm91dGVyIG1vZHVsZSB0byBhZGQgbmVzdGVkIHBhdGhzJyk7XG4gICAgfVxuICAgIGlmIChub2RlLnJvdXRhYmxlKSB7XG4gICAgICB0aGlzLnN1Ym1vZHVsZXNbZW50aXJlUGF0aF0gPSBub2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlQ2FsbGJhY2soZW50aXJlUGF0aCwgbm9kZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVyOyIsImNvbnN0IFJvdXRlciA9IHJlcXVpcmUoJy4vcm91dGVyJyk7XG5jb25zdCBwb3J0cyA9IHJlcXVpcmUoJy4vcG9ydHMnKTtcblxuY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcigpO1xuXG5yb3V0ZXIucm91dGUoJ2hleScsIChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICBjb25zb2xlLmxvZygnSEVZIFdURicpO1xuICBzZW5kUmVzcG9uc2UoeyBtZXNzYWdlOiAncmV0dXJuVXNlcid9KTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJvdXRlcjsiLCIvKipcbiogU2ltcGxlIHN0YXRlIG1hY2hpbmUgYmVjYXVzZSBhbmd1bGFyIGlzIGhhcmQgdG8gbWFuYWdlIGFuZCBJIG1pc3MgcmVhY3QuXG4qL1xuY2xhc3MgU3RhdGVNYWNoaW5lIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLnN0YXRlID0gJyc7XG4gICAgc2VsZi5zdGF0ZXNDYWxsYmFja3MgPSB7fTtcbiAgICBzZWxmLnByZXZpb3VzU3RhdGUgPSAnJztcbiAgICBzZWxmLmVycm9yQ2FsbGJhY2sgPSAoc3RhdGUpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlN0YXRlIFwiK3N0YXRlK1wiIGRvZXMgbm90IGV4aXN0XCIpO1xuICAgIH1cbiAgICBzZWxmLmFmdGVySG9vayA9IChzdGF0ZSkgPT4ge307XG4gIH1cblxuICBzZXRTdGF0ZSAobmV3U3RhdGUsIC4uLmFyZ3MpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuc3RhdGUgIT0gJycpIHtcbiAgICAgIHNlbGYucHJldmlvdXNTdGF0ZSA9IHNlbGYuc3RhdGU7XG4gICAgfVxuICAgIHNlbGYuc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICBzZWxmLmdvVG9TdGF0ZSguLi5hcmdzKTtcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGdldFN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgfVxuXG4gIGdldFByZXZpb3VzU3RhdGUgKCkge1xuICAgIHJldHVybiB0aGlzLnByZXZpb3VzU3RhdGU7XG4gIH1cblxuICBzZXRDbGVhbkNhbGxiYWNrIChjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmNsZWFuQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGNsZWFuICgpIHtcbiAgICB0aGlzLmNsZWFuQ2FsbGJhY2soKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGV4aXN0cyAoRikge1xuICAgIHJldHVybiAoRiE9PSBudWxsKSAmJiAoRiAhPT0gdW5kZWZpbmVkKTtcbiAgfVxuXG4gIHNldEVycm9yQ2FsbGJhY2sgKGNhbGxiYWNrKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuZXJyb3JDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgc2V0QWZ0ZXJIb29rIChjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmFmdGVySG9vayA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgZ29Ub1N0YXRlICguLi5hcmdzKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGlmKHNlbGYuZXhpc3RzKHNlbGYuY2xlYW5DYWxsYmFjaykpIHtcbiAgICAgIHNlbGYuY2xlYW5DYWxsYmFjaygpO1xuICAgIH1cbiAgICBsZXQgRiA9IHNlbGYuc3RhdGVzQ2FsbGJhY2tzW3NlbGYuc3RhdGVdO1xuICAgIGlmIChzZWxmLmV4aXN0cyhGKSkge1xuICAgICAgRiguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5lcnJvckNhbGxiYWNrKHNlbGYuc3RhdGUpO1xuICAgIH1cbiAgICBzZWxmLmFmdGVySG9vayhzZWxmLnN0YXRlKTtcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIHNldFN0YXRlQ2FsbGJhY2sgKHN0YXRlLCBjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLnN0YXRlc0NhbGxiYWNrc1tzdGF0ZV0gPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlTWFjaGluZTsiXX0=
