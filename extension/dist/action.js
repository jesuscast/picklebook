(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/unifyid/hacks/picklebook/extension/src/js/action.js":[function(require,module,exports){
'use strict';

var activated = false;

chrome.runtime.sendMessage({ message: 'getState' }, function (response) {
  activated = response.activated;
});

$(document).ready(function () {
  if (activated) {
    $('.toggle_mode').addClass('activated');
  } else {
    $('.toggle_mode').removeClass('activated');
  }
  $('.toggle_mode').on('click', function () {
    if (!activated) {
      activated = true;
      $('.toggle_mode').addClass('activated');
      chrome.runtime.sendMessage({ message: 'activate' });
    } else {
      activated = false;
      $('.toggle_mode').removeClass('activated');
      chrome.runtime.sendMessage({ message: 'deactivate' });
    }
  });
});

},{}]},{},["/Users/unifyid/hacks/picklebook/extension/src/js/action.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvYWN0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNDQSxJQUFJLFlBQVksS0FBaEI7O0FBRUEsT0FBTyxPQUFQLENBQWUsV0FBZixDQUEyQixFQUFFLFNBQVMsVUFBWCxFQUEzQixFQUFvRCxVQUFTLFFBQVQsRUFBbUI7QUFDckUsY0FBWSxTQUFTLFNBQXJCO0FBQ0QsQ0FGRDs7QUFJQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVU7QUFDMUIsTUFBSSxTQUFKLEVBQWU7QUFDYixNQUFFLGNBQUYsRUFBa0IsUUFBbEIsQ0FBMkIsV0FBM0I7QUFDRCxHQUZELE1BRU87QUFDTCxNQUFFLGNBQUYsRUFBa0IsV0FBbEIsQ0FBOEIsV0FBOUI7QUFDRDtBQUNELElBQUUsY0FBRixFQUFrQixFQUFsQixDQUFxQixPQUFyQixFQUE4QixZQUFXO0FBQ3ZDLFFBQUksQ0FBQyxTQUFMLEVBQWdCO0FBQ2Qsa0JBQVksSUFBWjtBQUNBLFFBQUUsY0FBRixFQUFrQixRQUFsQixDQUEyQixXQUEzQjtBQUNBLGFBQU8sT0FBUCxDQUFlLFdBQWYsQ0FBMkIsRUFBRSxTQUFTLFVBQVgsRUFBM0I7QUFDRCxLQUpELE1BSU87QUFDTCxrQkFBWSxLQUFaO0FBQ0EsUUFBRSxjQUFGLEVBQWtCLFdBQWxCLENBQThCLFdBQTlCO0FBQ0EsYUFBTyxPQUFQLENBQWUsV0FBZixDQUEyQixFQUFFLFNBQVMsWUFBWCxFQUEzQjtBQUNEO0FBQ0YsR0FWRDtBQVdELENBakJEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxubGV0IGFjdGl2YXRlZCA9IGZhbHNlO1xuXG5jaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IG1lc3NhZ2U6ICdnZXRTdGF0ZScgfSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgYWN0aXZhdGVkID0gcmVzcG9uc2UuYWN0aXZhdGVkO1xufSk7XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gIGlmIChhY3RpdmF0ZWQpIHtcbiAgICAkKCcudG9nZ2xlX21vZGUnKS5hZGRDbGFzcygnYWN0aXZhdGVkJyk7XG4gIH0gZWxzZSB7XG4gICAgJCgnLnRvZ2dsZV9tb2RlJykucmVtb3ZlQ2xhc3MoJ2FjdGl2YXRlZCcpO1xuICB9XG4gICQoJy50b2dnbGVfbW9kZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghYWN0aXZhdGVkKSB7XG4gICAgICBhY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgJCgnLnRvZ2dsZV9tb2RlJykuYWRkQ2xhc3MoJ2FjdGl2YXRlZCcpO1xuICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBtZXNzYWdlOiAnYWN0aXZhdGUnIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICQoJy50b2dnbGVfbW9kZScpLnJlbW92ZUNsYXNzKCdhY3RpdmF0ZWQnKTtcbiAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgbWVzc2FnZTogJ2RlYWN0aXZhdGUnIH0pO1xuICAgIH1cbiAgfSk7XG59KTsiXX0=
