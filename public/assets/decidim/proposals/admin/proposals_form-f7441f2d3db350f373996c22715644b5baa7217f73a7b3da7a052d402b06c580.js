"use strict";

$(function () {
  var attachGeocoding = window.Decidim.attachGeocoding;

  var $form = $(".proposal_form_admin");

  if ($form.length > 0) {
    (function () {
      var $proposalCreatedInMeeting = $form.find("#proposal_created_in_meeting");
      var $proposalMeeting = $form.find("#proposal_meeting");

      var toggleDisabledHiddenFields = function toggleDisabledHiddenFields() {
        var enabledMeeting = $proposalCreatedInMeeting.prop("checked");
        $proposalMeeting.find("select").attr("disabled", "disabled");
        $proposalMeeting.hide();

        if (enabledMeeting) {
          $proposalMeeting.find("select").attr("disabled", !enabledMeeting);
          $proposalMeeting.show();
        }
      };

      $proposalCreatedInMeeting.on("change", toggleDisabledHiddenFields);
      toggleDisabledHiddenFields();

      attachGeocoding($form.find("#proposal_address"));
    })();
  }
});
