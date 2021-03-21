"use strict";

var removeNewlineAdjacentSpaces = function removeNewlineAdjacentSpaces(text) {
  return text.replace(/\n\s/g, "\n");
};

$(function () {
  var $confirmButton = $(".destroy-meeting-alert");

  if ($confirmButton.length > 0) {
    $confirmButton.on("click", function () {
      var alertText = $confirmButton.data("invalid-destroy-message") + " \n\n";
      alertText += removeNewlineAdjacentSpaces($confirmButton.data("proposal-titles"));

      alert(alertText); // eslint-disable-line no-alert
    });
  }
});
