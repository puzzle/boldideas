"use strict";

$(function () {
  (function (exports) {
    var $conferenceScopeEnabled = $("#conference_scopes_enabled");
    var $conferenceScopeId = $("#conference_scope_id");
    var $form = $(".edit_conference, .new_conference");

    if ($form.length > 0) {
      (function () {
        $conferenceScopeEnabled.on("change", function (event) {
          var checked = event.target.checked;
          exports.theDataPicker.enabled($conferenceScopeId, checked);
        });
        exports.theDataPicker.enabled($conferenceScopeId, $conferenceScopeEnabled.prop("checked"));

        var $registrationsEnabled = $form.find("#conference_registrations_enabled");
        var $availableSlots = $form.find("#conference_available_slots");
        var toggleDisabledFields = function toggleDisabledFields() {
          var enabled = $registrationsEnabled.prop("checked");
          $availableSlots.attr("disabled", !enabled);

          $form.find("#conference_registrations_terms .editor-container").each(function (idx, node) {
            var quill = Quill.find(node);
            quill.enable(enabled);
          });
        };
        $registrationsEnabled.on("change", toggleDisabledFields);
        toggleDisabledFields();
      })();
    }
  })(window);
});
