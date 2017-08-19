const Router = require('./router');
const ports = require('./ports');

const router = new Router();

let activated = false;

router.route('getState', (request, sender, sendResponse) => {
  console.log(`getState requested: ${activated}`);
  sendResponse({ activated });
})
.route('activate', () => {
  activated = true;
  console.log(`Setting state to ${activated}`);
  ports.getPort('contentScript').then( (value) => {
    if (value) {
      console.log('Content script was loaded');
      value.postMessage({ message: 'activate' });
    } else {
      console.log('Content script was not loaded');
    }
  });
})
.route('deactivate', () => {
	activated = false;
	console.log(`Setting state to ${activated}`);
   ports.getPort('contentScript').then( (value) => {
    if (value) {
      console.log('Content script was loaded');
      value.postMessage({ message: 'deactivate' });
    } else {
      console.log('Content script was not loaded');
    }
  });
});


module.exports = router;