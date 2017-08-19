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

var router = new Router();

var activated = false;

router.route('activate', function () {
		activated = true;
		console.log('Activating');
		$("a[data-testid='fb-ufi-likelink']").hide();
		$(".share_action_link").hide();
}).route('deactivate', function () {
		activated = false;
		console.log('Deactivaing');
		$("a[data-testid='fb-ufi-likelink']").show();
		$(".share_action_link").show();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29udGVudC5qcyIsInNyYy9qcy9wb3J0cy5qcyIsInNyYy9qcy9yb3V0ZXIuanMiLCJzcmMvanMvc3RhdGVtYWNoaW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFNBQVMsUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7O0FBRUEsSUFBSSxPQUFPLE9BQU8sT0FBUCxDQUFlLE9BQWYsQ0FBdUIsRUFBQyxNQUFNLGVBQVAsRUFBdkIsQ0FBWDs7QUFFQSxNQUFNLE9BQU4sQ0FBYyxnQkFBZCxFQUFnQyxJQUFoQyxDQUFxQyxVQUFDLEtBQUQsRUFBVztBQUM5QyxNQUFHLENBQUMsS0FBSixFQUFVO0FBQ1IsVUFBTSxPQUFOLENBQWMsZ0JBQWQsRUFBZ0MsSUFBaEM7QUFDRDtBQUNGLENBSkQ7O0FBT0EsSUFBTSxTQUFTLElBQUksTUFBSixFQUFmOztBQUVBLElBQUksWUFBWSxLQUFoQjs7QUFFQSxPQUFPLEtBQVAsQ0FBYSxVQUFiLEVBQXlCLFlBQU07QUFDOUIsY0FBWSxJQUFaO0FBQ0EsVUFBUSxHQUFSLENBQVksWUFBWjtBQUNBLElBQUUsa0NBQUYsRUFBc0MsSUFBdEM7QUFDQSxJQUFFLG9CQUFGLEVBQXdCLElBQXhCO0FBQ0EsQ0FMRCxFQU1DLEtBTkQsQ0FNTyxZQU5QLEVBTXFCLFlBQU07QUFDMUIsY0FBWSxLQUFaO0FBQ0EsVUFBUSxHQUFSLENBQVksYUFBWjtBQUNBLElBQUUsa0NBQUYsRUFBc0MsSUFBdEM7QUFDQSxJQUFFLG9CQUFGLEVBQXdCLElBQXhCO0FBQ0EsQ0FYRDs7QUFhQTs7O0FBR0EsS0FBSyxTQUFMLENBQWUsV0FBZixDQUEyQixVQUFTLE9BQVQsRUFBa0IsTUFBbEIsRUFBMEIsWUFBMUIsRUFBd0M7QUFDakUsU0FBTyxHQUFQLENBQVcsUUFBUSxPQUFuQixFQUE0QixJQUE1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WDtBQUNBLFdBQUssZUFBTCxDQUFxQixLQUFyQixJQUE4QixRQUE5QjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7QUFHSCxPQUFPLE9BQVAsR0FBaUIsWUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgUm91dGVyID0gcmVxdWlyZSgnLi9yb3V0ZXInKTtcbmNvbnN0IHBvcnRzID0gcmVxdWlyZSgnLi9wb3J0cycpO1xuXG5sZXQgcG9ydCA9IGNocm9tZS5ydW50aW1lLmNvbm5lY3Qoe25hbWU6IFwiY29udGVudFNjcmlwdFwifSk7XG5cbnBvcnRzLmdldFBvcnQoJ2JhY2tncm91bmRQYWdlJykudGhlbigodmFsdWUpID0+IHtcbiAgaWYoIXZhbHVlKXtcbiAgICBwb3J0cy5zZXRQb3J0KCdiYWNrZ3JvdW5kUGFnZScsIHBvcnQpO1xuICB9XG59KTtcblxuXG5jb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG5cbmxldCBhY3RpdmF0ZWQgPSBmYWxzZTtcblxucm91dGVyLnJvdXRlKCdhY3RpdmF0ZScsICgpID0+IHtcblx0YWN0aXZhdGVkID0gdHJ1ZTtcblx0Y29uc29sZS5sb2coJ0FjdGl2YXRpbmcnKTtcblx0JChcImFbZGF0YS10ZXN0aWQ9J2ZiLXVmaS1saWtlbGluayddXCIpLmhpZGUoKTtcblx0JChcIi5zaGFyZV9hY3Rpb25fbGlua1wiKS5oaWRlKCk7XG59KVxuLnJvdXRlKCdkZWFjdGl2YXRlJywgKCkgPT4ge1xuXHRhY3RpdmF0ZWQgPSBmYWxzZTtcblx0Y29uc29sZS5sb2coJ0RlYWN0aXZhaW5nJyk7XG5cdCQoXCJhW2RhdGEtdGVzdGlkPSdmYi11ZmktbGlrZWxpbmsnXVwiKS5zaG93KCk7XG5cdCQoXCIuc2hhcmVfYWN0aW9uX2xpbmtcIikuc2hvdygpO1xufSk7XG5cbi8qKlxuKiBBdHRhY2ggdGhlIHJvdXRlcyB0byB0aGUgbWVzc2FnZSBsaXN0ZW5lci5cbiovXG5wb3J0Lm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihmdW5jdGlvbihyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkge1xuICByb3V0ZXIuZ2V0KHJlcXVlc3QubWVzc2FnZSwgcG9ydCwgcmVxdWVzdCwgc2VuZFJlc3BvbnNlKTtcbn0pOyIsIi8qXG4qIE5vdGU6IEFjY2Vzc2luZyB0aGlzIGZyb20gdGhlIGJhY2tncm91bmQgc2NyaXB0IGNvbnRleHQgaXNcbiogZGlmZmVyZW50IHRoYW4gYWNjZXNzaW5nIHRoaXMgZnJvbSB0aGUgY29udGVudCBzY3JpcHQgY29udGV4dC5cbiovXG5cbmxldCBhY3Rpb25QYWdlUG9ydCA9IG51bGw7XG5sZXQgYmFja2dyb3VuZFBvcnQgPSBudWxsO1xubGV0IHBhc3N3b3JkTW9kYWxQb3J0ID0gbnVsbDtcbmxldCBjaGFsbGVuZ2VNb2RhbFBvcnQgPSBudWxsO1xuXG5sZXQgY29udGVudFBvcnRzID0ge307XG5sZXQgYXBwUG9ydHMgPSB7fTtcblxuXG5sZXQgY2hhbmdlTGlzdGVuZXJzID0ge1xuICBhY3Rpb25QYWdlOiBbXSxcbiAgY29udGVudFNjcmlwdDogW10sXG4gIGFwcDogW10sXG4gIGJhY2tncm91bmRQYWdlOiBbXSxcbiAgcGFzc3dvcmRNb2RhbDogW10sXG4gIGNoYWxsZW5nZU1vZGFsOiBbXVxufTtcblxubGV0IHNldHRlcnMgPSB7XG4gIGFjdGlvblBhZ2U6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBhY3Rpb25QYWdlUG9ydCA9IHBvcnQ7XG4gIH0sXG4gIGNvbnRlbnRTY3JpcHQ6IGZ1bmN0aW9uKHBvcnQsIHRhYklkKSB7XG4gICAgY29udGVudFBvcnRzW3RhYklkXSA9IHBvcnQ7XG4gIH0sXG4gIGFwcDogZnVuY3Rpb24ocG9ydCwgdGFiSWQpIHtcbiAgICBhcHBQb3J0c1t0YWJJZF0gPSBwb3J0O1xuICB9LFxuICBiYWNrZ3JvdW5kUGFnZTogZnVuY3Rpb24ocG9ydCkge1xuICAgIGJhY2tncm91bmRQb3J0ID0gcG9ydDtcbiAgfSxcbiAgcGFzc3dvcmRNb2RhbDogZnVuY3Rpb24ocG9ydCkge1xuICAgIHBhc3N3b3JkTW9kYWxQb3J0ID0gcG9ydDtcbiAgfSxcbiAgY2hhbGxlbmdlTW9kYWw6IGZ1bmN0aW9uKHBvcnQpIHtcbiAgICBjaGFsbGVuZ2VNb2RhbFBvcnQgPSBwb3J0O1xuICB9XG59O1xuXG5sZXQgZ2V0dGVycyA9IHtcbiAgYWN0aW9uUGFnZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUoYWN0aW9uUGFnZVBvcnQpO1xuICAgIH0pO1xuICB9LFxuICBjb250ZW50U2NyaXB0OiBmdW5jdGlvbih0YWIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYoIXRhYikge1xuICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlfSwgZnVuY3Rpb24odGFicykge1xuICAgICAgICAgIGlmICghdGFicyB8fCB0YWJzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZWplY3QoXCJObyBjb250ZW50IHNjcmlwdCBwb3J0IGZvdW5kXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGNvbnRlbnRQb3J0c1t0YWJzWzBdLmlkXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShjb250ZW50UG9ydHNbdGFiLmlkXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGFwcDogZnVuY3Rpb24odGFiKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmKCF0YWIpIHtcbiAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZX0sIGZ1bmN0aW9uKHRhYnMpIHtcbiAgICAgICAgICBpZiAoIXRhYnMgfHwgdGFicy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmVqZWN0KCdObyBhY3RpdmUgdGFiIGZvdW5kJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoeyBwb3J0OiBhcHBQb3J0c1t0YWJzWzBdLmlkXSwgdGFiOiB0YWJzWzBdIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoeyBwb3J0OiBhcHBQb3J0c1t0YWIuaWRdLCB0YWIgfSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgYmFja2dyb3VuZFBhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKGJhY2tncm91bmRQb3J0KTtcbiAgICB9KTtcbiAgfSxcbiAgcGFzc3dvcmRNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUocGFzc3dvcmRNb2RhbFBvcnQpO1xuICAgIH0pO1xuICB9LFxuICBjaGFsbGVuZ2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUoY2hhbGxlbmdlTW9kYWxQb3J0KTtcbiAgICB9KTtcbiAgfVxufTtcblxubGV0IFBvcnRVdGlsID0ge1xuICBzZXRQb3J0OiBmdW5jdGlvbihwYWdlLCBwb3J0KSB7XG4gICAgaWYgKCBPYmplY3Qua2V5cyhzZXR0ZXJzKS5pbmRleE9mKHBhZ2UpID09IC0xICl7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBuYW1lIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFwb3J0KSB7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBpcyBub3QgZGVmaW5lZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgdGFiSWQgPSBudWxsO1xuICAgIGlmIChwb3J0LnNlbmRlciAmJiBwb3J0LnNlbmRlci50YWIpIHtcbiAgICAgIHRhYklkID0gcG9ydC5zZW5kZXIudGFiLmlkO1xuICAgIH1cbiAgICBzZXR0ZXJzW3BhZ2VdKHBvcnQsIHRhYklkKTtcbiAgICBwb3J0Lm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICBzZXR0ZXJzW3BhZ2VdKG51bGwsIHRhYklkKTtcbiAgICB9KTtcbiAgICBjaGFuZ2VMaXN0ZW5lcnNbcGFnZV0uZm9yRWFjaCgoY2FsbGJhY2spID0+IHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH0sXG4gIGdldFBvcnQ6IGZ1bmN0aW9uKHBhZ2UsIHRhYikge1xuICAgIGlmICggT2JqZWN0LmtleXMoc2V0dGVycykuaW5kZXhPZihwYWdlKSA9PSAtMSApe1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgbmFtZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBnZXR0ZXJzW3BhZ2VdKHRhYik7XG4gIH0sXG4gIC8qKlxuICAqIFJldHVybnMgYWxsIGFwcCBwb3J0cy5cbiAgKi9cbiAgZ2V0QXBwUG9ydHM6IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICByZXR1cm4gYXBwUG9ydHM7XG4gIH0sXG4gIC8qKlxuICAqIFJldHVybnMgYWxsIGNvbnRlbnQgc2NyaXB0IHBvcnRzLlxuICAqL1xuICBnZXRDb250ZW50U2NyaXB0UG9ydHM6IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICByZXR1cm4gY29udGVudFBvcnRzO1xuICB9LFxuICBhZGRMaXN0ZW5lcjogZnVuY3Rpb24ocGFnZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIE9iamVjdC5rZXlzKGNoYW5nZUxpc3RlbmVycykuaW5kZXhPZihwYWdlKSA9PSAtMSApe1xuICAgICAgY29uc29sZS5sb2coJ1BvcnQgbmFtZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNoYW5nZUxpc3RlbmVyc1twYWdlXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvcnRVdGlsOyIsImNvbnN0IFN0YXRlTWFjaGluZSA9IHJlcXVpcmUoJy4vc3RhdGVtYWNoaW5lJyk7XG5cbmNsYXNzIFJvdXRlciBleHRlbmRzIFN0YXRlTWFjaGluZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucm91dGFibGUgPSB0cnVlO1xuICAgIHRoaXMuc3VibW9kdWxlcyA9IHt9O1xuICB9XG5cbiAgZ2V0IChlbnRpcmVQYXRoLCAuLi5hcmdzKSB7XG4gICAgbGV0IHBhdGhzTGlzdCA9IGVudGlyZVBhdGguc3BsaXQoXCIvXCIpO1xuICAgIGlmKHBhdGhzTGlzdC5sZW5ndGggPiAxKSB7XG4gICAgICBjb25zdCBjdXJyZW5QYXRoID0gcGF0aHNMaXN0LnNoaWZ0KCk7XG4gICAgICBpZiAoIE9iamVjdC5rZXlzKHRoaXMuc3VibW9kdWxlcykuaW5kZXhPZihjdXJyZW5QYXRoKSAhPT0gLTEgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1Ym1vZHVsZXNbY3VycmVuUGF0aF0uZ2V0KHBhdGhzTGlzdC5qb2luKFwiL1wiKSwgLi4uYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoY3VycmVuUGF0aCsnOiBQYXRoIG5vdCBkZWZpZW5kJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFN0YXRlKGVudGlyZVBhdGgsIC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJvdXRlIChlbnRpcmVQYXRoLCBub2RlKSB7XG4gICAgbGV0IHBhdGhzTGlzdCA9IGVudGlyZVBhdGguc3BsaXQoXCIvXCIpO1xuICAgIGlmKHBhdGhzTGlzdC5sZW5ndGggPiAxICl7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSB1c2UgYSBzdWIgcm91dGVyIG1vZHVsZSB0byBhZGQgbmVzdGVkIHBhdGhzJyk7XG4gICAgfVxuICAgIGlmIChub2RlLnJvdXRhYmxlKSB7XG4gICAgICB0aGlzLnN1Ym1vZHVsZXNbZW50aXJlUGF0aF0gPSBub2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlQ2FsbGJhY2soZW50aXJlUGF0aCwgbm9kZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVyOyIsIi8qKlxuKiBTaW1wbGUgc3RhdGUgbWFjaGluZSBiZWNhdXNlIGFuZ3VsYXIgaXMgaGFyZCB0byBtYW5hZ2UgYW5kIEkgbWlzcyByZWFjdC5cbiovXG5jbGFzcyBTdGF0ZU1hY2hpbmUge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuc3RhdGUgPSAnJztcbiAgICBzZWxmLnN0YXRlc0NhbGxiYWNrcyA9IHt9O1xuICAgIHNlbGYucHJldmlvdXNTdGF0ZSA9ICcnO1xuICAgIHNlbGYuZXJyb3JDYWxsYmFjayA9IChzdGF0ZSkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3RhdGUgXCIrc3RhdGUrXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gICAgfVxuICAgIHNlbGYuYWZ0ZXJIb29rID0gKHN0YXRlKSA9PiB7fTtcbiAgfVxuXG4gIHNldFN0YXRlIChuZXdTdGF0ZSwgLi4uYXJncykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi5zdGF0ZSAhPSAnJykge1xuICAgICAgc2VsZi5wcmV2aW91c1N0YXRlID0gc2VsZi5zdGF0ZTtcbiAgICB9XG4gICAgc2VsZi5zdGF0ZSA9IG5ld1N0YXRlO1xuICAgIHNlbGYuZ29Ub1N0YXRlKC4uLmFyZ3MpO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgZ2V0U3RhdGUgKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICB9XG5cbiAgZ2V0UHJldmlvdXNTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJldmlvdXNTdGF0ZTtcbiAgfVxuXG4gIHNldENsZWFuQ2FsbGJhY2sgKGNhbGxiYWNrKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuY2xlYW5DYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgY2xlYW4gKCkge1xuICAgIHRoaXMuY2xlYW5DYWxsYmFjaygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZXhpc3RzIChGKSB7XG4gICAgcmV0dXJuIChGIT09IG51bGwpICYmIChGICE9PSB1bmRlZmluZWQpO1xuICB9XG5cbiAgc2V0RXJyb3JDYWxsYmFjayAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5lcnJvckNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBzZXRBZnRlckhvb2sgKGNhbGxiYWNrKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuYWZ0ZXJIb29rID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBnb1RvU3RhdGUgKC4uLmFyZ3MpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgaWYoc2VsZi5leGlzdHMoc2VsZi5jbGVhbkNhbGxiYWNrKSkge1xuICAgICAgc2VsZi5jbGVhbkNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGxldCBGID0gc2VsZi5zdGF0ZXNDYWxsYmFja3Nbc2VsZi5zdGF0ZV07XG4gICAgaWYgKHNlbGYuZXhpc3RzKEYpKSB7XG4gICAgICBGKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLmVycm9yQ2FsbGJhY2soc2VsZi5zdGF0ZSk7XG4gICAgfVxuICAgIHNlbGYuYWZ0ZXJIb29rKHNlbGYuc3RhdGUpO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG5cbiAgc2V0U3RhdGVDYWxsYmFjayAoc3RhdGUsIGNhbGxiYWNrKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGYuc3RhdGVzQ2FsbGJhY2tzW3N0YXRlXSA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBzZWxmO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVNYWNoaW5lOyJdfQ==
