"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

$(function () {
  if (!window.localStorage) {
    return;
  }

  var getDismissedHelpers = function getDismissedHelpers() {
    var serialized = localStorage.getItem("dismissedHelpers");
    if (!serialized) {
      return [];
    }

    return serialized.split(",");
  };

  var addDismissedHelper = function addDismissedHelper(id) {
    var dismissedHelpers = getDismissedHelpers();

    if (!dismissedHelpers.includes(id)) {
      localStorage.setItem("dismissedHelpers", [].concat(_toConsumableArray(dismissedHelpers), [id]).join(","));
    }
  };

  var dismissedHelpers = getDismissedHelpers();

  $(".floating-helper-container").each(function (_index, elem) {
    var id = $(elem).data("help-id");

    $(".floating-helper__trigger, .floating-helper__content-close", elem).on("click", function (ev) {
      ev.preventDefault();
    });

    if (!dismissedHelpers.includes(id)) {
      $(".floating-helper", elem).foundation("toggle");
      $(".floating-helper__wrapper", elem).foundation("toggle");

      $(".floating-helper", elem).on("off.zf.toggler", function () {
        addDismissedHelper(id);
      });
    }
  });
});
