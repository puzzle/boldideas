"use strict";

(function (exports) {
  var createFieldDependentInputs = exports.DecidimAdmin.createFieldDependentInputs;

  var $assemblyMemberType = $("#assembly_member_existing_user");

  createFieldDependentInputs({
    controllerField: $assemblyMemberType,
    wrapperSelector: ".user-fields",
    dependentFieldsSelector: ".user-fields--full-name",
    dependentInputSelector: "input",
    enablingCondition: function enablingCondition($field) {
      return $field.val() === "false";
    }
  });

  createFieldDependentInputs({
    controllerField: $assemblyMemberType,
    wrapperSelector: ".user-fields",
    dependentFieldsSelector: ".user-fields--user-picker",
    dependentInputSelector: "input",
    enablingCondition: function enablingCondition($field) {
      return $field.val() === "true";
    }
  });

  var $assemblyMemberPosition = $("#assembly_member_position");

  createFieldDependentInputs({
    controllerField: $assemblyMemberPosition,
    wrapperSelector: ".position-fields",
    dependentFieldsSelector: ".position-fields--position-other",
    dependentInputSelector: "input",
    enablingCondition: function enablingCondition($field) {
      return $field.val() === "other";
    }
  });
})(window);
