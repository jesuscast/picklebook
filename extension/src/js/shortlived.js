const Router = require('./router');
const ports = require('./ports');

const router = new Router();

router.route('hey', (request, sender, sendResponse) => {
  console.log('HEY WTF');
  sendResponse({ message: 'returnUser'});
});

module.exports = router;