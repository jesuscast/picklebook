const Router = require('./router');
const ports = require('./ports');

let port = chrome.runtime.connect({name: "contentScript"});

ports.getPort('backgroundPage').then((value) => {
  if(!value){
    ports.setPort('backgroundPage', port);
  }
});

let consistencyLooper = function() {
  if(activated) {
    $("a:contains('Like')").hide();
    $(".share_action_link").hide();
    $(".comment_link").hide();
  } else {
    $("a:contains('Like')").show();
    $(".share_action_link").show();
    $(".comment_link").show();
  }
  setTimeout(consistencyLooper, 1000);
}

$(document).ready(function() {
  consistencyLooper();
});

const router = new Router();

let activated = false;

router.route('activate', () => {
	activated = true;
  console.log($("a:contains('Like')"));
	console.log('Activating');
})
.route('deactivate', () => {
	activated = false;
	console.log('Deactivaing');
});

/**
* Attach the routes to the message listener.
*/
port.onMessage.addListener(function(request, sender, sendResponse) {
  router.get(request.message, port, request, sendResponse);
});