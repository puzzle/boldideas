"use strict";

$(function () {
  var $checkbox = $(".represent-user-group").find("input#user_group");
  var $userGroupFields = $(".user-group-fields");

  $checkbox.click(function () {
    var $select = $userGroupFields.find("select");

    if (!$select.val()) {
      $userGroupFields.toggle();
    }

    if ($userGroupFields.is(":visible")) {
      $checkbox.prop("checked", true);
    } else {
      $checkbox.prop("checked", false);
    }
  });
});
