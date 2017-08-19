
let activated = false;

chrome.runtime.sendMessage({ message: 'getState' }, function(response) {
  activated = response.activated;
  if (activated) {
    activate();
  } else {
    deactivate();
  }
});

let activate = () => {
  $('.toggle_mode .activated').show();
  $('.toggle_mode .deactivated').hide();
}

let deactivate = () => {
  $('.toggle_mode .activated').hide();
  $('.toggle_mode .deactivated').show();
}

$(document).ready(function(){
  $('.toggle_mode').on('click', function() {
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
});