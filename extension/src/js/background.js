const ports = require('./ports');
const LongLivedConnection = require('./longlived');
const ShortLivedConnections = require('./shortlived');

/**
* Everything between the angular app and the background script.
*/
chrome.runtime.onConnect.addListener(function(port) {
  ports.setPort(port.name, port);
  port.onMessage.addListener(function(request, sender, sendResponse) {
    setTimeout(() => {
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
  setTimeout(() => {
    ShortLivedConnections.get(request.message, request, sender, sendResponse);
  }, 1);
  // Necessary to return true for async responses.
  return true;
});