(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/unifyid/hacks/picklebook/extension/src/js/content.js":[function(require,module,exports){
'use strict';

var Router = require('./router');
var ports = require('./ports');

var port = chrome.runtime.connect({ name: "contentScript" });

ports.getPort('backgroundPage').then(function (value) {
  if (!value) {
    ports.setPort('backgroundPage', port);
  }
});

var consistencyLooper = function consistencyLooper() {
  if (activated) {
    $("a:contains('Like')").hide();
    $(".share_action_link").hide();
    $(".comment_link").hide();
  } else {
    $("a:contains('Like')").show();
    $(".share_action_link").show();
    $(".comment_link").show();
  }
  setTimeout(consistencyLooper, 1000);
};

$(document).ready(function () {
  consistencyLooper();
});

var router = new Router();

var activated = false;

router.route('activate', function () {
  activated = true;
  console.log($(".share_action_link"));
  console.log('Activating');
}).route('deactivate', function () {
  activated = false;
  console.log('Deactivaing');
});

/**
* Attach the routes to the message listener.
*/
port.onMessage.addListener(function (request, sender, sendResponse) {
  router.get(request.message, port, request, sendResponse);
});

},{"./ports":"/Users/unifyid/hacks/picklebook/extension/src/js/ports.js","./router":"/Users/unifyid/hacks/picklebook/extension/src/js/router.js"}],"/Users/unifyid/hacks/picklebook/extension/src/js/ports.js":[function(require,module,exports){
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

},{"./statemachine":"/Users/unifyid/hacks/picklebook/extension/src/js/statemachine.js"}],"/Users/unifyid/hacks/picklebook/extension/src/js/statemachine.js":[function(require,module,exports){
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

},{}]},{},["/Users/unifyid/hacks/picklebook/extension/src/js/content.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29udGVudC5qcyIsInNyYy9qcy9wb3J0cy5qcyIsInNyYy9qcy9yb3V0ZXIuanMiLCJzcmMvanMvc3RhdGVtYWNoaW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFNBQVMsUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7O0FBRUEsSUFBSSxPQUFPLE9BQU8sT0FBUCxDQUFlLE9BQWYsQ0FBdUIsRUFBQyxNQUFNLGVBQVAsRUFBdkIsQ0FBWDs7QUFFQSxNQUFNLE9BQU4sQ0FBYyxnQkFBZCxFQUFnQyxJQUFoQyxDQUFxQyxVQUFDLEtBQUQsRUFBVztBQUM5QyxNQUFHLENBQUMsS0FBSixFQUFVO0FBQ1IsVUFBTSxPQUFOLENBQWMsZ0JBQWQsRUFBZ0MsSUFBaEM7QUFDRDtBQUNGLENBSkQ7O0FBTUEsSUFBSSxvQkFBb0IsU0FBcEIsaUJBQW9CLEdBQVc7QUFDakMsTUFBRyxTQUFILEVBQWM7QUFDWixNQUFFLG9CQUFGLEVBQXdCLElBQXhCO0FBQ0EsTUFBRSxvQkFBRixFQUF3QixJQUF4QjtBQUNBLE1BQUUsZUFBRixFQUFtQixJQUFuQjtBQUNELEdBSkQsTUFJTztBQUNMLE1BQUUsb0JBQUYsRUFBd0IsSUFBeEI7QUFDQSxNQUFFLG9CQUFGLEVBQXdCLElBQXhCO0FBQ0EsTUFBRSxlQUFGLEVBQW1CLElBQW5CO0FBQ0Q7QUFDRCxhQUFXLGlCQUFYLEVBQThCLElBQTlCO0FBQ0QsQ0FYRDs7QUFhQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVc7QUFDM0I7QUFDRCxDQUZEOztBQUlBLElBQU0sU0FBUyxJQUFJLE1BQUosRUFBZjs7QUFFQSxJQUFJLFlBQVksS0FBaEI7O0FBRUEsT0FBTyxLQUFQLENBQWEsVUFBYixFQUF5QixZQUFNO0FBQzlCLGNBQVksSUFBWjtBQUNDLFVBQVEsR0FBUixD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Q2xDLGFBQUssYUFBTDtBQUNEO0FBQ0QsVUFBSSxJQUFJLEtBQUssZUFBTCxDQUFxQixLQUFLLEtBQTFCLENBQVI7QUFDQSxVQUFJLEtBQUssTUFBTCxDQUFZLENBQVosQ0FBSixFQUFvQjtBQUNsQjtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssYUFBTCxDQUFtQixLQUFLLEtBQXhCO0FBQ0Q7QUFDRCxXQUFLLFNBQUwsQ0FBZSxLQUFLLEtBQXBCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OztxQ0FFaUIsSyxFQUFPLFEsRUFBVTtBQUNqQyxVQUFJLE9BQU8sSUFBWDtBQUNBLFdBQUssZUFBTCxDQUFxQixLQUFyQixJQUE4QixRQUE5QjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7QUFHSCxPQUFPLE9BQVAsR0FBaUIsWUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgUm91dGVyID0gcmVxdWlyZSgnLi9yb3V0ZXInKTtcbmNvbnN0IHBvcnRzID0gcmVxdWlyZSgnLi9wb3J0cycpO1xuXG5sZXQgcG9ydCA9IGNocm9tZS5ydW50aW1lLmNvbm5lY3Qoe25hbWU6IFwiY29udGVudFNjcmlwdFwifSk7XG5cbnBvcnRzLmdldFBvcnQoJ2JhY2tncm91bmRQYWdlJykudGhlbigodmFsdWUpID0+IHtcbiAgaWYoIXZhbHVlKXtcbiAgICBwb3J0cy5zZXRQb3J0KCdiYWNrZ3JvdW5kUGFnZScsIHBvcnQpO1xuICB9XG59KTtcblxubGV0IGNvbnNpc3RlbmN5TG9vcGVyID0gZnVuY3Rpb24oKSB7XG4gIGlmKGFjdGl2YXRlZCkge1xuICAgICQoXCJhOmNvbnRhaW5zKCdMaWtlJylcIikuaGlkZSgpO1xuICAgICQoXCIuc2hhcmVfYWN0aW9uX2xpbmtcIikuaGlkZSgpO1xuICAgICQoXCIuY29tbWVudF9saW5rXCIpLmhpZGUoKTtcbiAgfSBlbHNlIHtcbiAgICAkKFwiYTpjb250YWlucygnTGlrZScpXCIpLnNob3coKTtcbiAgICAkKFwiLnNoYXJlX2FjdGlvbl9saW5rXCIpLnNob3coKTtcbiAgICAkKFwiLmNvbW1lbnRfbGlua1wiKS5zaG93KCk7XG4gIH1cbiAgc2V0VGltZW91dChjb25zaXN0ZW5jeUxvb3BlciwgMTAwMCk7XG59XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICBjb25zaXN0ZW5jeUxvb3BlcigpO1xufSk7XG5cbmNvbnN0IHJvdXRlciA9IG5ldyBSb3V0ZXIoKTtcblxubGV0IGFjdGl2YXRlZCA9IGZhbHNlO1xuXG5yb3V0ZXIucm91dGUoJ2FjdGl2YXRlJywgKCkgPT4ge1xuXHRhY3RpdmF0ZWQgPSB0cnVlO1xuICBjb25zb2xlLmxvZygkKFwiLnNoYXJlX2FjdGlvbl9saW5rXCIpKTtcblx0Y29uc29sZS5sb2coJ0FjdGl2YXRpbmcnKTtcbn0pXG4ucm91dGUoJ2RlYWN0aXZhdGUnLCAoKSA9PiB7XG5cdGFjdGl2YXRlZCA9IGZhbHNlO1xuXHRjb25zb2xlLmxvZygnRGVhY3RpdmFpbmcnKTtcbn0pO1xuXG4vKipcbiogQXR0YWNoIHRoZSByb3V0ZXMgdG8gdGhlIG1lc3NhZ2UgbGlzdGVuZXIuXG4qL1xucG9ydC5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoZnVuY3Rpb24ocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpIHtcbiAgcm91dGVyLmdldChyZXF1ZXN0Lm1lc3NhZ2UsIHBvcnQsIHJlcXVlc3QsIHNlbmRSZXNwb25zZSk7XG59KTsiLCIvKlxuKiBOb3RlOiBBY2Nlc3NpbmcgdGhpcyBmcm9tIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdCBjb250ZXh0IGlzXG4qIGRpZmZlcmVudCB0aGFuIGFjY2Vzc2luZyB0aGlzIGZyb20gdGhlIGNvbnRlbnQgc2NyaXB0IGNvbnRleHQuXG4qL1xuXG5sZXQgYWN0aW9uUGFnZVBvcnQgPSBudWxsO1xubGV0IGJhY2tncm91bmRQb3J0ID0gbnVsbDtcbmxldCBwYXNzd29yZE1vZGFsUG9ydCA9IG51bGw7XG5sZXQgY2hhbGxlbmdlTW9kYWxQb3J0ID0gbnVsbDtcblxubGV0IGNvbnRlbnRQb3J0cyA9IHt9O1xubGV0IGFwcFBvcnRzID0ge307XG5cblxubGV0IGNoYW5nZUxpc3RlbmVycyA9IHtcbiAgYWN0aW9uUGFnZTogW10sXG4gIGNvbnRlbnRTY3JpcHQ6IFtdLFxuICBhcHA6IFtdLFxuICBiYWNrZ3JvdW5kUGFnZTogW10sXG4gIHBhc3N3b3JkTW9kYWw6IFtdLFxuICBjaGFsbGVuZ2VNb2RhbDogW11cbn07XG5cbmxldCBzZXR0ZXJzID0ge1xuICBhY3Rpb25QYWdlOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgYWN0aW9uUGFnZVBvcnQgPSBwb3J0O1xuICB9LFxuICBjb250ZW50U2NyaXB0OiBmdW5jdGlvbihwb3J0LCB0YWJJZCkge1xuICAgIGNvbnRlbnRQb3J0c1t0YWJJZF0gPSBwb3J0O1xuICB9LFxuICBhcHA6IGZ1bmN0aW9uKHBvcnQsIHRhYklkKSB7XG4gICAgYXBwUG9ydHNbdGFiSWRdID0gcG9ydDtcbiAgfSxcbiAgYmFja2dyb3VuZFBhZ2U6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBiYWNrZ3JvdW5kUG9ydCA9IHBvcnQ7XG4gIH0sXG4gIHBhc3N3b3JkTW9kYWw6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBwYXNzd29yZE1vZGFsUG9ydCA9IHBvcnQ7XG4gIH0sXG4gIGNoYWxsZW5nZU1vZGFsOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgY2hhbGxlbmdlTW9kYWxQb3J0ID0gcG9ydDtcbiAgfVxufTtcblxubGV0IGdldHRlcnMgPSB7XG4gIGFjdGlvblBhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKGFjdGlvblBhZ2VQb3J0KTtcbiAgICB9KTtcbiAgfSxcbiAgY29udGVudFNjcmlwdDogZnVuY3Rpb24odGFiKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmKCF0YWIpIHtcbiAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZX0sIGZ1bmN0aW9uKHRhYnMpIHtcbiAgICAgICAgICBpZiAoIXRhYnMgfHwgdGFicy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmVqZWN0KFwiTm8gY29udGVudCBzY3JpcHQgcG9ydCBmb3VuZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZShjb250ZW50UG9ydHNbdGFic1swXS5pZF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoY29udGVudFBvcnRzW3RhYi5pZF0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBhcHA6IGZ1bmN0aW9uKHRhYikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZighdGFiKSB7XG4gICAgICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWV9LCBmdW5jdGlvbih0YWJzKSB7XG4gICAgICAgICAgaWYgKCF0YWJzIHx8IHRhYnMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHJlamVjdCgnTm8gYWN0aXZlIHRhYiBmb3VuZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKHsgcG9ydDogYXBwUG9ydHNbdGFic1swXS5pZF0sIHRhYjogdGFic1swXSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKHsgcG9ydDogYXBwUG9ydHNbdGFiLmlkXSwgdGFiIH0pXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGJhY2tncm91bmRQYWdlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShiYWNrZ3JvdW5kUG9ydCk7XG4gICAgfSk7XG4gIH0sXG4gIHBhc3N3b3JkTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKHBhc3N3b3JkTW9kYWxQb3J0KTtcbiAgICB9KTtcbiAgfSxcbiAgY2hhbGxlbmdlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKGNoYWxsZW5nZU1vZGFsUG9ydCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbmxldCBQb3J0VXRpbCA9IHtcbiAgc2V0UG9ydDogZnVuY3Rpb24ocGFnZSwgcG9ydCkge1xuICAgIGlmICggT2JqZWN0LmtleXMoc2V0dGVycykuaW5kZXhPZihwYWdlKSA9PSAtMSApe1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgbmFtZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghcG9ydCkge1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgaXMgbm90IGRlZmluZWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHRhYklkID0gbnVsbDtcbiAgICBpZiAocG9ydC5zZW5kZXIgJiYgcG9ydC5zZW5kZXIudGFiKSB7XG4gICAgICB0YWJJZCA9IHBvcnQuc2VuZGVyLnRhYi5pZDtcbiAgICB9XG4gICAgc2V0dGVyc1twYWdlXShwb3J0LCB0YWJJZCk7XG4gICAgcG9ydC5vbkRpc2Nvbm5lY3QuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgICAgc2V0dGVyc1twYWdlXShudWxsLCB0YWJJZCk7XG4gICAgfSk7XG4gICAgY2hhbmdlTGlzdGVuZXJzW3BhZ2VdLmZvckVhY2goKGNhbGxiYWNrKSA9PiB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICB9LFxuICBnZXRQb3J0OiBmdW5jdGlvbihwYWdlLCB0YWIpIHtcbiAgICBpZiAoIE9iamVjdC5rZXlzKHNldHRlcnMpLmluZGV4T2YocGFnZSkgPT0gLTEgKXtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IG5hbWUgbm90IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0dGVyc1twYWdlXSh0YWIpO1xuICB9LFxuICAvKipcbiAgKiBSZXR1cm5zIGFsbCBhcHAgcG9ydHMuXG4gICovXG4gIGdldEFwcFBvcnRzOiBmdW5jdGlvbihwYWdlKSB7XG4gICAgcmV0dXJuIGFwcFBvcnRzO1xuICB9LFxuICAvKipcbiAgKiBSZXR1cm5zIGFsbCBjb250ZW50IHNjcmlwdCBwb3J0cy5cbiAgKi9cbiAgZ2V0Q29udGVudFNjcmlwdFBvcnRzOiBmdW5jdGlvbihwYWdlKSB7XG4gICAgcmV0dXJuIGNvbnRlbnRQb3J0cztcbiAgfSxcbiAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uKHBhZ2UsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCBPYmplY3Qua2V5cyhjaGFuZ2VMaXN0ZW5lcnMpLmluZGV4T2YocGFnZSkgPT0gLTEgKXtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IG5hbWUgbm90IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjaGFuZ2VMaXN0ZW5lcnNbcGFnZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQb3J0VXRpbDsiLCJjb25zdCBTdGF0ZU1hY2hpbmUgPSByZXF1aXJlKCcuL3N0YXRlbWFjaGluZScpO1xuXG5jbGFzcyBSb3V0ZXIgZXh0ZW5kcyBTdGF0ZU1hY2hpbmUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJvdXRhYmxlID0gdHJ1ZTtcbiAgICB0aGlzLnN1Ym1vZHVsZXMgPSB7fTtcbiAgfVxuXG4gIGdldCAoZW50aXJlUGF0aCwgLi4uYXJncykge1xuICAgIGxldCBwYXRoc0xpc3QgPSBlbnRpcmVQYXRoLnNwbGl0KFwiL1wiKTtcbiAgICBpZihwYXRoc0xpc3QubGVuZ3RoID4gMSkge1xuICAgICAgY29uc3QgY3VycmVuUGF0aCA9IHBhdGhzTGlzdC5zaGlmdCgpO1xuICAgICAgaWYgKCBPYmplY3Qua2V5cyh0aGlzLnN1Ym1vZHVsZXMpLmluZGV4T2YoY3VycmVuUGF0aCkgIT09IC0xICkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJtb2R1bGVzW2N1cnJlblBhdGhdLmdldChwYXRoc0xpc3Quam9pbihcIi9cIiksIC4uLmFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGN1cnJlblBhdGgrJzogUGF0aCBub3QgZGVmaWVuZCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTdGF0ZShlbnRpcmVQYXRoLCAuLi5hcmdzKTtcbiAgICB9XG4gIH1cblxuICByb3V0ZSAoZW50aXJlUGF0aCwgbm9kZSkge1xuICAgIGxldCBwYXRoc0xpc3QgPSBlbnRpcmVQYXRoLnNwbGl0KFwiL1wiKTtcbiAgICBpZihwYXRoc0xpc3QubGVuZ3RoID4gMSApe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgdXNlIGEgc3ViIHJvdXRlciBtb2R1bGUgdG8gYWRkIG5lc3RlZCBwYXRocycpO1xuICAgIH1cbiAgICBpZiAobm9kZS5yb3V0YWJsZSkge1xuICAgICAgdGhpcy5zdWJtb2R1bGVzW2VudGlyZVBhdGhdID0gbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZXRTdGF0ZUNhbGxiYWNrKGVudGlyZVBhdGgsIG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcjsiLCIvKipcbiogU2ltcGxlIHN0YXRlIG1hY2hpbmUgYmVjYXVzZSBhbmd1bGFyIGlzIGhhcmQgdG8gbWFuYWdlIGFuZCBJIG1pc3MgcmVhY3QuXG4qL1xuY2xhc3MgU3RhdGVNYWNoaW5lIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLnN0YXRlID0gJyc7XG4gICAgc2VsZi5zdGF0ZXNDYWxsYmFja3MgPSB7fTtcbiAgICBzZWxmLnByZXZpb3VzU3RhdGUgPSAnJztcbiAgICBzZWxmLmVycm9yQ2FsbGJhY2sgPSAoc3RhdGUpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlN0YXRlIFwiK3N0YXRlK1wiIGRvZXMgbm90IGV4aXN0XCIpO1xuICAgIH1cbiAgICBzZWxmLmFmdGVySG9vayA9IChzdGF0ZSkgPT4ge307XG4gIH1cblxuICBzZXRTdGF0ZSAobmV3U3RhdGUsIC4uLmFyZ3MpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHNlbGYuc3RhdGUgIT0gJycpIHtcbiAgICAgIHNlbGYucHJldmlvdXNTdGF0ZSA9IHNlbGYuc3RhdGU7XG4gICAgfVxuICAgIHNlbGYuc3RhdGUgPSBuZXdTdGF0ZTtcbiAgICBzZWxmLmdvVG9TdGF0ZSguLi5hcmdzKTtcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGdldFN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgfVxuXG4gIGdldFByZXZpb3VzU3RhdGUgKCkge1xuICAgIHJldHVybiB0aGlzLnByZXZpb3VzU3RhdGU7XG4gIH1cblxuICBzZXRDbGVhbkNhbGxiYWNrIChjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmNsZWFuQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGNsZWFuICgpIHtcbiAgICB0aGlzLmNsZWFuQ2FsbGJhY2soKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGV4aXN0cyAoRikge1xuICAgIHJldHVybiAoRiE9PSBudWxsKSAmJiAoRiAhPT0gdW5kZWZpbmVkKTtcbiAgfVxuXG4gIHNldEVycm9yQ2FsbGJhY2sgKGNhbGxiYWNrKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuZXJyb3JDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgc2V0QWZ0ZXJIb29rIChjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmFmdGVySG9vayA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgZ29Ub1N0YXRlICguLi5hcmdzKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGlmKHNlbGYuZXhpc3RzKHNlbGYuY2xlYW5DYWxsYmFjaykpIHtcbiAgICAgIHNlbGYuY2xlYW5DYWxsYmFjaygpO1xuICAgIH1cbiAgICBsZXQgRiA9IHNlbGYuc3RhdGVzQ2FsbGJhY2tzW3NlbGYuc3RhdGVdO1xuICAgIGlmIChzZWxmLmV4aXN0cyhGKSkge1xuICAgICAgRiguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5lcnJvckNhbGxiYWNrKHNlbGYuc3RhdGUpO1xuICAgIH1cbiAgICBzZWxmLmFmdGVySG9vayhzZWxmLnN0YXRlKTtcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIHNldFN0YXRlQ2FsbGJhY2sgKHN0YXRlLCBjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLnN0YXRlc0NhbGxiYWNrc1tzdGF0ZV0gPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlTWFjaGluZTsiXX0=
