"use strict";

(function (exports) {
  var createFieldDependentInputs = exports.DecidimAdmin.createFieldDependentInputs;

  var $attendeeType = $('[name="meeting_registration_invite[existing_user]"');

  createFieldDependentInputs({
    controllerField: $attendeeType,
    wrapperSelector: ".attendee-fields",
    dependentFieldsSelector: ".attendee-fields--new-user",
    dependentInputSelector: "input",
    enablingCondition: function enablingCondition() {
      return $("#meeting_registration_invite_existing_user_false").is(":checked");
    }
  });

  createFieldDependentInputs({
    controllerField: $attendeeType,
    wrapperSelector: ".attendee-fields",
    dependentFieldsSelector: ".attendee-fields--user-picker",
    dependentInputSelector: "input",
    enablingCondition: function enablingCondition() {
      return $("#meeting_registration_invite_existing_user_true").is(":checked");
    }
  });
})(window);
