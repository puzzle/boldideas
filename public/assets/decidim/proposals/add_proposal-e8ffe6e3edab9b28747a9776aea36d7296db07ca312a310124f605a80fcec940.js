"use strict";

$(function () {
  var attachGeocoding = window.Decidim.attachGeocoding;

  window.DecidimProposals = window.DecidimProposals || {};

  window.DecidimProposals.bindProposalAddress = function () {
    var $checkbox = $("input:checkbox[name$='[has_address]']");
    var $addressInput = $("#address_input");

    if ($checkbox.length > 0) {
      var toggleInput = function toggleInput() {
        if ($checkbox[0].checked) {
          $addressInput.show();
        } else {
          $addressInput.hide();
        }
      };
      toggleInput();
      $checkbox.on("change", toggleInput);
    }

    if ($addressInput.length > 0) {
      attachGeocoding($("input", $addressInput));
    }
  };

  window.DecidimProposals.bindProposalAddress();
});
