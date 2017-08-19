const Router = require('./router');
const ports = require('./ports');

let port = chrome.runtime.connect({name: "contentScript"});

ports.getPort('backgroundPage').then((value) => {
  if(!value){
    ports.setPort('backgroundPage', port);
  }
});


const router = new Router();

let activated = false;

router.route('activate', () => {
	activated = true;
	console.log('Activating');
	$("a[data-testid='fb-ufi-likelink']").hide();
	$(".share_action_link").hide();
})
.route('deactivate', () => {
	activated = false;
	console.log('Deactivaing');
	$("a[data-testid='fb-ufi-likelink']").show();
	$(".share_action_link").show();
});

/**
* Attach the routes to the message listener.
*/
port.onMessage.addListener(function(request, sender, sendResponse) {
  router.get(request.message, port, request, sendResponse);
});