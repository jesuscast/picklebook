
chrome.runtime.sendMessage({ message: 'hey' }, function(response) {
console.log(response);
});