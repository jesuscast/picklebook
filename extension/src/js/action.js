
let activated = false;

chrome.runtime.sendMessage({ message: 'getState' }, function(response) {
  activated = response.activated;
});

$(document).ready(function(){
  if (activated) {
    $('.toggle_mode').addClass('activated');
  } else {
    $('.toggle_mode').removeClass('activated');
  }
  $('.toggle_mode').on('click', function() {
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