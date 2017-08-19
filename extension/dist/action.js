(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/unifyid/hacks/picklebook/extension/src/js/action.js":[function(require,module,exports){
'use strict';

var activated = false;

chrome.runtime.sendMessage({ message: 'getState' }, function (response) {
  activated = response.activated;
  if (activated) {
    activate();
  } else {
    deactivate();
  }
});

var activate = function activate() {
  $('.toggle_mode .activated').show();
  $('.toggle_mode .deactivated').hide();
};

var deactivate = function deactivate() {
  $('.toggle_mode .activated').hide();
  $('.toggle_mode .deactivated').show();
};

$(document).ready(function () {
  $('.toggle_mode').on('click', function () {
    if (!activated) {
      activated = true;
      activate();
      chrome.runtime.sendMessage({ message: 'activate' });
    } else {
      activated = false;
      deactivate();
      chrome.runtime.sendMessage({ message: 'deactivate' });
    }
  });

  $(".photos").on("click", function() {
    console.log("ASDF");
    $.ajax({
      type: "GET",
      cache: false, 
      url: "https://ffeca37c.ngrok.io/links/lol",
      contentType: "application/json",
      success: function(res) {
        console.log(res);
        console.log(res.links)
        if (res.links) {
          //res.links.map(function(url) {
            var url = res.links[0];
            var key_arr = url.split("/");
            getAndShowPhoto("lol", key_arr[key_arr.length - 1]);
          //});
        }
      }
    });
  });

});

function getAndShowPhoto(user_id, url) {
  $.ajax({
    type: "GET",
    cache: false, 
    url: "https://ffeca37c.ngrok.io/photo/lol/" + url,
    contentType: "application/json",
    success: function(res) {
      var base64Data = base64Encode(res);
      console.log(base64Data);
      var img = $(".hellyeah");
      img.attr("src", "data:image/jpg;base64, " + base64Data);
    }
  });
}

function base64Encode(str) {
	var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var out = "", i = 0, len = str.length, c1, c2, c3;
	while (i < len) {
		c1 = str.charCodeAt(i++) & 0xff;
		if (i == len) {
			out += CHARS.charAt(c1 >> 2);
			out += CHARS.charAt((c1 & 0x3) << 4);
			out += "==";
			break;
		}
		c2 = str.charCodeAt(i++);
		if (i == len) {
			out += CHARS.charAt(c1 >> 2);
			out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
			out += CHARS.charAt((c2 & 0xF) << 2);
			out += "=";
			break;
		}
		c3 = str.charCodeAt(i++);
		out += CHARS.charAt(c1 >> 2);
		out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
		out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
		out += CHARS.charAt(c3 & 0x3F);
	}
	return out;
}


},{}]},{},["/Users/unifyid/hacks/picklebook/extension/src/js/action.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYWN0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNDQSxJQUFJLFlBQVksS0FBaEI7O0FBRUEsT0FBTyxPQUFQLENBQWUsV0FBZixDQUEyQixFQUFFLFNBQVMsVUFBWCxFQUEzQixFQUFvRCxVQUFTLFFBQVQsRUFBbUI7QUFDckUsY0FBWSxTQUFTLFNBQXJCO0FBQ0EsTUFBSSxTQUFKLEVBQWU7QUFDYjtBQUNELEdBRkQsTUFFTztBQUNMO0FBQ0Q7QUFDRixDQVBEOztBQVNBLElBQUksV0FBVyxTQUFYLFFBQVcsR0FBTTtBQUNuQixJQUFFLHlCQUFGLEVBQTZCLElBQTdCO0FBQ0EsSUFBRSwyQkFBRixFQUErQixJQUEvQjtBQUNELENBSEQ7O0FBS0EsSUFBSSxhQUFhLFNBQWIsVUFBYSxHQUFNO0FBQ3JCLElBQUUseUJBQUYsRUFBNkIsSUFBN0I7QUFDQSxJQUFFLDJCQUFGLEVBQStCLElBQS9CO0FBQ0QsQ0FIRDs7QUFLQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVU7QUFDMUIsSUFBRSxjQUFGLEVBQWtCLEVBQWxCLENBQXFCLE9BQXJCLEVBQThCLFlBQVc7QUFDdkMsUUFBSSxDQUFDLFNBQUwsRUFBZ0I7QUFDZCxrQkFBWSxJQUFaO0FBQ0E7QUFDQSxhQUFPLE9BQVAsQ0FBZSxXQUFmLENBQTJCLEVBQUUsU0FBUyxVQUFYLEVBQTNCO0FBQ0QsS0FKRCxNQUlPO0FBQ0wsa0JBQVksS0FBWjtBQUNBO0FBQ0EsYUFBTyxPQUFQLENBQWUsV0FBZixDQUEyQixFQUFFLFNBQVMsWUFBWCxFQUEzQjtBQUNEO0FBQ0YsR0FWRDtBQVdELENBWkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG5sZXQgYWN0aXZhdGVkID0gZmFsc2U7XG5cbmNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgbWVzc2FnZTogJ2dldFN0YXRlJyB9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICBhY3RpdmF0ZWQgPSByZXNwb25zZS5hY3RpdmF0ZWQ7XG4gIGlmIChhY3RpdmF0ZWQpIHtcbiAgICBhY3RpdmF0ZSgpO1xuICB9IGVsc2Uge1xuICAgIGRlYWN0aXZhdGUoKTtcbiAgfVxufSk7XG5cbmxldCBhY3RpdmF0ZSA9ICgpID0+IHtcbiAgJCgnLnRvZ2dsZV9tb2RlIC5hY3RpdmF0ZWQnKS5zaG93KCk7XG4gICQoJy50b2dnbGVfbW9kZSAuZGVhY3RpdmF0ZWQnKS5oaWRlKCk7XG59XG5cbmxldCBkZWFjdGl2YXRlID0gKCkgPT4ge1xuICAkKCcudG9nZ2xlX21vZGUgLmFjdGl2YXRlZCcpLmhpZGUoKTtcbiAgJCgnLnRvZ2dsZV9tb2RlIC5kZWFjdGl2YXRlZCcpLnNob3coKTtcbn1cblxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcbiAgJCgnLnRvZ2dsZV9tb2RlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFhY3RpdmF0ZWQpIHtcbiAgICAgIGFjdGl2YXRlZCA9IHRydWU7XG4gICAgICBhY3RpdmF0ZSgpO1xuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBtZXNzYWdlOiAnYWN0aXZhdGUnIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgIGRlYWN0aXZhdGUoKTtcbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgbWVzc2FnZTogJ2RlYWN0aXZhdGUnIH0pO1xuICAgIH1cbiAgfSk7XG59KTsiXX0=
