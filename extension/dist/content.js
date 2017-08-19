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
  try {
    if (activated) {
      $("a[data-testid='fb-ufi-likelink']").hide();
      $(".share_action_link").hide();
    } else {
      $("a[data-testid='fb-ufi-likelink']").show();
      $(".share_action_link").show();
    }
  } catch (err) {
    console.log(err);
  }
  setTimeout(consistencyLooper, 300);
};

$(document).ready(function () {
  consistencyLooper();
});

var router = new Router();

var activated = false;

router.route('activate', function () {
  activated = true;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29udGVudC5qcyIsInNyYy9qcy9wb3J0cy5qcyIsInNyYy9qcy9yb3V0ZXIuanMiLCJzcmMvanMvc3RhdGVtYWNoaW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFNBQVMsUUFBUSxVQUFSLENBQWY7QUFDQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7O0FBRUEsSUFBSSxPQUFPLE9BQU8sT0FBUCxDQUFlLE9BQWYsQ0FBdUIsRUFBQyxNQUFNLGVBQVAsRUFBdkIsQ0FBWDs7QUFFQSxNQUFNLE9BQU4sQ0FBYyxnQkFBZCxFQUFnQyxJQUFoQyxDQUFxQyxVQUFDLEtBQUQsRUFBVztBQUM5QyxNQUFHLENBQUMsS0FBSixFQUFVO0FBQ1IsVUFBTSxPQUFOLENBQWMsZ0JBQWQsRUFBZ0MsSUFBaEM7QUFDRDtBQUNGLENBSkQ7O0FBTUEsSUFBSSxvQkFBb0IsU0FBcEIsaUJBQW9CLEdBQVc7QUFDakMsTUFBSTtBQUNGLFFBQUcsU0FBSCxFQUFjO0FBQ1osUUFBRSxrQ0FBRixFQUFzQyxJQUF0QztBQUNBLFFBQUUsb0JBQUYsRUFBd0IsSUFBeEI7QUFDRCxLQUhELE1BR087QUFDTCxRQUFFLGtDQUFGLEVBQXNDLElBQXRDO0FBQ0EsUUFBRSxvQkFBRixFQUF3QixJQUF4QjtBQUNEO0FBQ0YsR0FSRCxDQVFFLE9BQU0sR0FBTixFQUFXO0FBQ1gsWUFBUSxHQUFSLENBQVksR0FBWjtBQUNEO0FBQ0QsYUFBVyxpQkFBWCxFQUE4QixHQUE5QjtBQUNELENBYkQ7O0FBZUEsRUFBRSxRQUFGLEVBQVksS0FBWixDQUFrQixZQUFXO0FBQzNCO0FBQ0QsQ0FGRDs7QUFJQSxJQUFNLFNBQVMsSUFBSSxNQUFKLEVBQWY7O0FBRUEsSUFBSSxZQUFZLEtBQWhCOztBQUVBLE9BQU8sS0FBUCxDQUFhLFVBQWIsRUFBeUIsWUFBTTtBQUM5QixjQUFZLElBQVo7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QUNELFVBQUksSUFBSSxLQUFLLGVBQUwsQ0FBcUIsS0FBSyxLQUExQixDQUFSO0FBQ0EsVUFBSSxLQUFLLE1BQUwsQ0FBWSxDQUFaLENBQUosRUFBb0I7QUFDbEI7QUFDRCxPQUZELE1BRU87QUFDTCxhQUFLLGFBQUwsQ0FBbUIsS0FBSyxLQUF4QjtBQUNEO0FBQ0QsV0FBSyxTQUFMLENBQWUsS0FBSyxLQUFwQjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7cUNBRWlCLEssRUFBTyxRLEVBQVU7QUFDakMsVUFBSSxPQUFPLElBQVg7QUFDQSxXQUFLLGVBQUwsQ0FBcUIsS0FBckIsSUFBOEIsUUFBOUI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O0FBR0gsT0FBTyxPQUFQLEdBQWlCLFlBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IFJvdXRlciA9IHJlcXVpcmUoJy4vcm91dGVyJyk7XG5jb25zdCBwb3J0cyA9IHJlcXVpcmUoJy4vcG9ydHMnKTtcblxubGV0IHBvcnQgPSBjaHJvbWUucnVudGltZS5jb25uZWN0KHtuYW1lOiBcImNvbnRlbnRTY3JpcHRcIn0pO1xuXG5wb3J0cy5nZXRQb3J0KCdiYWNrZ3JvdW5kUGFnZScpLnRoZW4oKHZhbHVlKSA9PiB7XG4gIGlmKCF2YWx1ZSl7XG4gICAgcG9ydHMuc2V0UG9ydCgnYmFja2dyb3VuZFBhZ2UnLCBwb3J0KTtcbiAgfVxufSk7XG5cbmxldCBjb25zaXN0ZW5jeUxvb3BlciA9IGZ1bmN0aW9uKCkge1xuICB0cnkge1xuICAgIGlmKGFjdGl2YXRlZCkge1xuICAgICAgJChcImFbZGF0YS10ZXN0aWQ9J2ZiLXVmaS1saWtlbGluayddXCIpLmhpZGUoKTtcbiAgICAgICQoXCIuc2hhcmVfYWN0aW9uX2xpbmtcIikuaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAkKFwiYVtkYXRhLXRlc3RpZD0nZmItdWZpLWxpa2VsaW5rJ11cIikuc2hvdygpO1xuICAgICAgJChcIi5zaGFyZV9hY3Rpb25fbGlua1wiKS5zaG93KCk7XG4gICAgfVxuICB9IGNhdGNoKGVycikge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH1cbiAgc2V0VGltZW91dChjb25zaXN0ZW5jeUxvb3BlciwgMzAwKTtcbn1cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gIGNvbnNpc3RlbmN5TG9vcGVyKCk7XG59KTtcblxuY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcigpO1xuXG5sZXQgYWN0aXZhdGVkID0gZmFsc2U7XG5cbnJvdXRlci5yb3V0ZSgnYWN0aXZhdGUnLCAoKSA9PiB7XG5cdGFjdGl2YXRlZCA9IHRydWU7XG5cdGNvbnNvbGUubG9nKCdBY3RpdmF0aW5nJyk7XG59KVxuLnJvdXRlKCdkZWFjdGl2YXRlJywgKCkgPT4ge1xuXHRhY3RpdmF0ZWQgPSBmYWxzZTtcblx0Y29uc29sZS5sb2coJ0RlYWN0aXZhaW5nJyk7XG59KTtcblxuLyoqXG4qIEF0dGFjaCB0aGUgcm91dGVzIHRvIHRoZSBtZXNzYWdlIGxpc3RlbmVyLlxuKi9cbnBvcnQub25NZXNzYWdlLmFkZExpc3RlbmVyKGZ1bmN0aW9uKHJlcXVlc3QsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSB7XG4gIHJvdXRlci5nZXQocmVxdWVzdC5tZXNzYWdlLCBwb3J0LCByZXF1ZXN0LCBzZW5kUmVzcG9uc2UpO1xufSk7IiwiLypcbiogTm90ZTogQWNjZXNzaW5nIHRoaXMgZnJvbSB0aGUgYmFja2dyb3VuZCBzY3JpcHQgY29udGV4dCBpc1xuKiBkaWZmZXJlbnQgdGhhbiBhY2Nlc3NpbmcgdGhpcyBmcm9tIHRoZSBjb250ZW50IHNjcmlwdCBjb250ZXh0LlxuKi9cblxubGV0IGFjdGlvblBhZ2VQb3J0ID0gbnVsbDtcbmxldCBiYWNrZ3JvdW5kUG9ydCA9IG51bGw7XG5sZXQgcGFzc3dvcmRNb2RhbFBvcnQgPSBudWxsO1xubGV0IGNoYWxsZW5nZU1vZGFsUG9ydCA9IG51bGw7XG5cbmxldCBjb250ZW50UG9ydHMgPSB7fTtcbmxldCBhcHBQb3J0cyA9IHt9O1xuXG5cbmxldCBjaGFuZ2VMaXN0ZW5lcnMgPSB7XG4gIGFjdGlvblBhZ2U6IFtdLFxuICBjb250ZW50U2NyaXB0OiBbXSxcbiAgYXBwOiBbXSxcbiAgYmFja2dyb3VuZFBhZ2U6IFtdLFxuICBwYXNzd29yZE1vZGFsOiBbXSxcbiAgY2hhbGxlbmdlTW9kYWw6IFtdXG59O1xuXG5sZXQgc2V0dGVycyA9IHtcbiAgYWN0aW9uUGFnZTogZnVuY3Rpb24ocG9ydCkge1xuICAgIGFjdGlvblBhZ2VQb3J0ID0gcG9ydDtcbiAgfSxcbiAgY29udGVudFNjcmlwdDogZnVuY3Rpb24ocG9ydCwgdGFiSWQpIHtcbiAgICBjb250ZW50UG9ydHNbdGFiSWRdID0gcG9ydDtcbiAgfSxcbiAgYXBwOiBmdW5jdGlvbihwb3J0LCB0YWJJZCkge1xuICAgIGFwcFBvcnRzW3RhYklkXSA9IHBvcnQ7XG4gIH0sXG4gIGJhY2tncm91bmRQYWdlOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgYmFja2dyb3VuZFBvcnQgPSBwb3J0O1xuICB9LFxuICBwYXNzd29yZE1vZGFsOiBmdW5jdGlvbihwb3J0KSB7XG4gICAgcGFzc3dvcmRNb2RhbFBvcnQgPSBwb3J0O1xuICB9LFxuICBjaGFsbGVuZ2VNb2RhbDogZnVuY3Rpb24ocG9ydCkge1xuICAgIGNoYWxsZW5nZU1vZGFsUG9ydCA9IHBvcnQ7XG4gIH1cbn07XG5cbmxldCBnZXR0ZXJzID0ge1xuICBhY3Rpb25QYWdlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShhY3Rpb25QYWdlUG9ydCk7XG4gICAgfSk7XG4gIH0sXG4gIGNvbnRlbnRTY3JpcHQ6IGZ1bmN0aW9uKHRhYikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBpZighdGFiKSB7XG4gICAgICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWV9LCBmdW5jdGlvbih0YWJzKSB7XG4gICAgICAgICAgaWYgKCF0YWJzIHx8IHRhYnMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHJlamVjdChcIk5vIGNvbnRlbnQgc2NyaXB0IHBvcnQgZm91bmRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoY29udGVudFBvcnRzW3RhYnNbMF0uaWRdKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKGNvbnRlbnRQb3J0c1t0YWIuaWRdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgYXBwOiBmdW5jdGlvbih0YWIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYoIXRhYikge1xuICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlfSwgZnVuY3Rpb24odGFicykge1xuICAgICAgICAgIGlmICghdGFicyB8fCB0YWJzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZWplY3QoJ05vIGFjdGl2ZSB0YWIgZm91bmQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZSh7IHBvcnQ6IGFwcFBvcnRzW3RhYnNbMF0uaWRdLCB0YWI6IHRhYnNbMF0gfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZSh7IHBvcnQ6IGFwcFBvcnRzW3RhYi5pZF0sIHRhYiB9KVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBiYWNrZ3JvdW5kUGFnZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUoYmFja2dyb3VuZFBvcnQpO1xuICAgIH0pO1xuICB9LFxuICBwYXNzd29yZE1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShwYXNzd29yZE1vZGFsUG9ydCk7XG4gICAgfSk7XG4gIH0sXG4gIGNoYWxsZW5nZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVzb2x2ZShjaGFsbGVuZ2VNb2RhbFBvcnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG5sZXQgUG9ydFV0aWwgPSB7XG4gIHNldFBvcnQ6IGZ1bmN0aW9uKHBhZ2UsIHBvcnQpIHtcbiAgICBpZiAoIE9iamVjdC5rZXlzKHNldHRlcnMpLmluZGV4T2YocGFnZSkgPT0gLTEgKXtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IG5hbWUgbm90IGF2YWlsYWJsZScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXBvcnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdQb3J0IGlzIG5vdCBkZWZpbmVkJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCB0YWJJZCA9IG51bGw7XG4gICAgaWYgKHBvcnQuc2VuZGVyICYmIHBvcnQuc2VuZGVyLnRhYikge1xuICAgICAgdGFiSWQgPSBwb3J0LnNlbmRlci50YWIuaWQ7XG4gICAgfVxuICAgIHNldHRlcnNbcGFnZV0ocG9ydCwgdGFiSWQpO1xuICAgIHBvcnQub25EaXNjb25uZWN0LmFkZExpc3RlbmVyKCgpID0+IHtcbiAgICAgIHNldHRlcnNbcGFnZV0obnVsbCwgdGFiSWQpO1xuICAgIH0pO1xuICAgIGNoYW5nZUxpc3RlbmVyc1twYWdlXS5mb3JFYWNoKChjYWxsYmFjaykgPT4ge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgfSxcbiAgZ2V0UG9ydDogZnVuY3Rpb24ocGFnZSwgdGFiKSB7XG4gICAgaWYgKCBPYmplY3Qua2V5cyhzZXR0ZXJzKS5pbmRleE9mKHBhZ2UpID09IC0xICl7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBuYW1lIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGdldHRlcnNbcGFnZV0odGFiKTtcbiAgfSxcbiAgLyoqXG4gICogUmV0dXJucyBhbGwgYXBwIHBvcnRzLlxuICAqL1xuICBnZXRBcHBQb3J0czogZnVuY3Rpb24ocGFnZSkge1xuICAgIHJldHVybiBhcHBQb3J0cztcbiAgfSxcbiAgLyoqXG4gICogUmV0dXJucyBhbGwgY29udGVudCBzY3JpcHQgcG9ydHMuXG4gICovXG4gIGdldENvbnRlbnRTY3JpcHRQb3J0czogZnVuY3Rpb24ocGFnZSkge1xuICAgIHJldHVybiBjb250ZW50UG9ydHM7XG4gIH0sXG4gIGFkZExpc3RlbmVyOiBmdW5jdGlvbihwYWdlLCBjYWxsYmFjaykge1xuICAgIGlmICggT2JqZWN0LmtleXMoY2hhbmdlTGlzdGVuZXJzKS5pbmRleE9mKHBhZ2UpID09IC0xICl7XG4gICAgICBjb25zb2xlLmxvZygnUG9ydCBuYW1lIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2hhbmdlTGlzdGVuZXJzW3BhZ2VdLnB1c2goY2FsbGJhY2spO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUG9ydFV0aWw7IiwiY29uc3QgU3RhdGVNYWNoaW5lID0gcmVxdWlyZSgnLi9zdGF0ZW1hY2hpbmUnKTtcblxuY2xhc3MgUm91dGVyIGV4dGVuZHMgU3RhdGVNYWNoaW5lIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5yb3V0YWJsZSA9IHRydWU7XG4gICAgdGhpcy5zdWJtb2R1bGVzID0ge307XG4gIH1cblxuICBnZXQgKGVudGlyZVBhdGgsIC4uLmFyZ3MpIHtcbiAgICBsZXQgcGF0aHNMaXN0ID0gZW50aXJlUGF0aC5zcGxpdChcIi9cIik7XG4gICAgaWYocGF0aHNMaXN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgIGNvbnN0IGN1cnJlblBhdGggPSBwYXRoc0xpc3Quc2hpZnQoKTtcbiAgICAgIGlmICggT2JqZWN0LmtleXModGhpcy5zdWJtb2R1bGVzKS5pbmRleE9mKGN1cnJlblBhdGgpICE9PSAtMSApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VibW9kdWxlc1tjdXJyZW5QYXRoXS5nZXQocGF0aHNMaXN0LmpvaW4oXCIvXCIpLCAuLi5hcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihjdXJyZW5QYXRoKyc6IFBhdGggbm90IGRlZmllbmQnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoZW50aXJlUGF0aCwgLi4uYXJncyk7XG4gICAgfVxuICB9XG5cbiAgcm91dGUgKGVudGlyZVBhdGgsIG5vZGUpIHtcbiAgICBsZXQgcGF0aHNMaXN0ID0gZW50aXJlUGF0aC5zcGxpdChcIi9cIik7XG4gICAgaWYocGF0aHNMaXN0Lmxlbmd0aCA+IDEgKXtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHVzZSBhIHN1YiByb3V0ZXIgbW9kdWxlIHRvIGFkZCBuZXN0ZWQgcGF0aHMnKTtcbiAgICB9XG4gICAgaWYgKG5vZGUucm91dGFibGUpIHtcbiAgICAgIHRoaXMuc3VibW9kdWxlc1tlbnRpcmVQYXRoXSA9IG5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2V0U3RhdGVDYWxsYmFjayhlbnRpcmVQYXRoLCBub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb3V0ZXI7IiwiLyoqXG4qIFNpbXBsZSBzdGF0ZSBtYWNoaW5lIGJlY2F1c2UgYW5ndWxhciBpcyBoYXJkIHRvIG1hbmFnZSBhbmQgSSBtaXNzIHJlYWN0LlxuKi9cbmNsYXNzIFN0YXRlTWFjaGluZSB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zdGF0ZSA9ICcnO1xuICAgIHNlbGYuc3RhdGVzQ2FsbGJhY2tzID0ge307XG4gICAgc2VsZi5wcmV2aW91c1N0YXRlID0gJyc7XG4gICAgc2VsZi5lcnJvckNhbGxiYWNrID0gKHN0YXRlKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdGF0ZSBcIitzdGF0ZStcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICB9XG4gICAgc2VsZi5hZnRlckhvb2sgPSAoc3RhdGUpID0+IHt9O1xuICB9XG5cbiAgc2V0U3RhdGUgKG5ld1N0YXRlLCAuLi5hcmdzKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGlmIChzZWxmLnN0YXRlICE9ICcnKSB7XG4gICAgICBzZWxmLnByZXZpb3VzU3RhdGUgPSBzZWxmLnN0YXRlO1xuICAgIH1cbiAgICBzZWxmLnN0YXRlID0gbmV3U3RhdGU7XG4gICAgc2VsZi5nb1RvU3RhdGUoLi4uYXJncyk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBnZXRTdGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gIH1cblxuICBnZXRQcmV2aW91c1N0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcmV2aW91c1N0YXRlO1xuICB9XG5cbiAgc2V0Q2xlYW5DYWxsYmFjayAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5jbGVhbkNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBjbGVhbiAoKSB7XG4gICAgdGhpcy5jbGVhbkNhbGxiYWNrKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBleGlzdHMgKEYpIHtcbiAgICByZXR1cm4gKEYhPT0gbnVsbCkgJiYgKEYgIT09IHVuZGVmaW5lZCk7XG4gIH1cblxuICBzZXRFcnJvckNhbGxiYWNrIChjYWxsYmFjaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmVycm9yQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIHNldEFmdGVySG9vayAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5hZnRlckhvb2sgPSBjYWxsYmFjaztcbiAgICByZXR1cm4gc2VsZjtcbiAgfVxuXG4gIGdvVG9TdGF0ZSAoLi4uYXJncykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBpZihzZWxmLmV4aXN0cyhzZWxmLmNsZWFuQ2FsbGJhY2spKSB7XG4gICAgICBzZWxmLmNsZWFuQ2FsbGJhY2soKTtcbiAgICB9XG4gICAgbGV0IEYgPSBzZWxmLnN0YXRlc0NhbGxiYWNrc1tzZWxmLnN0YXRlXTtcbiAgICBpZiAoc2VsZi5leGlzdHMoRikpIHtcbiAgICAgIEYoLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGYuZXJyb3JDYWxsYmFjayhzZWxmLnN0YXRlKTtcbiAgICB9XG4gICAgc2VsZi5hZnRlckhvb2soc2VsZi5zdGF0ZSk7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cblxuICBzZXRTdGF0ZUNhbGxiYWNrIChzdGF0ZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zdGF0ZXNDYWxsYmFja3Nbc3RhdGVdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIHNlbGY7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZU1hY2hpbmU7Il19
