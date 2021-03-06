"use strict";

(function (exports) {
  var createFieldDependentInputs = exports.DecidimAdmin.createFieldDependentInputs;

  var $conferenceSpeakerType = $("#conference_speaker_existing_user");

  createFieldDependentInputs({
    controllerField: $conferenceSpeakerType,
    wrapperSelector: ".user-fields",
    dependentFieldsSelector: ".user-fields--full-name",
    dependentInputSelector: "input",
    enablingCondition: function enablingCondition($field) {
      return $field.val() === "false";
    }
  });

  createFieldDependentInputs({
    controllerField: $conferenceSpeakerType,
    wrapperSelector: ".user-fields",
    dependentFieldsSelector: ".user-fields--user-picker",
    dependentInputSelector: "input",
    enablingCondition: function enablingCondition($field) {
      return $field.val() === "true";
    }
  });
})(window);
