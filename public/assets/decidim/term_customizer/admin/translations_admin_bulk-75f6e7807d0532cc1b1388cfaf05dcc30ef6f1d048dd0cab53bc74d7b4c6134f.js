

/* eslint-disable no-invalid-this */

"use strict";

$(document).ready(function () {
  var selectedTranslationsCount = function selectedTranslationsCount() {
    return $(".table-list .js-check-all-translation:checked").length;
  };

  window.selectedTranslationsCountUpdate = function () {
    if (selectedTranslationsCount() === 0) {
      $("#js-selected-translation-count").text("");
    } else {
      $("#js-selected-translation-count").text(selectedTranslationsCount());
    }
  };

  var showBulkActionsButton = function showBulkActionsButton() {
    if (selectedTranslationsCount() > 0) {
      $("#js-bulk-actions-button").removeClass("hide");
    }
  };

  var hideBulkActionsButton = function hideBulkActionsButton() {
    var force = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

    if (selectedTranslationsCount() === 0 || force === true) {
      $("#js-bulk-actions-button").addClass("hide");
      $("#js-bulk-actions-dropdown").removeClass("is-open");
    }
  };

  window.showOtherActionsButtons = function () {
    $("#js-other-actions-wrapper").removeClass("hide");
  };

  var hideOtherActionsButtons = function hideOtherActionsButtons() {
    $("#js-other-actions-wrapper").addClass("hide");
  };

  window.hideBulkActionForms = function () {
    return $(".js-bulk-action-form").addClass("hide");
  };

  if ($(".js-bulk-action-form").length) {
    window.hideBulkActionForms();
    $("#js-bulk-actions-button").addClass("hide");

    $("#js-bulk-actions-dropdown ul li button").click(function (ev) {
      ev.preventDefault();
      var action = $(ev.target).data("action");

      if (action) {
        $("#js-form-" + action).submit(function () {
          $(".layout-content > .callout-wrapper").html("");
        });

        $("#js-" + action + "-actions").removeClass("hide");
        hideBulkActionsButton(true);
        hideOtherActionsButtons();
      }
    });

    // select all checkboxes
    $(".js-check-all").change(function () {
      $(".js-check-all-translation").prop("checked", $(this).prop("checked"));

      if ($(this).prop("checked")) {
        $(".js-check-all-translation").closest("tr").addClass("selected");
        showBulkActionsButton();
      } else {
        $(".js-check-all-translation").closest("tr").removeClass("selected");
        hideBulkActionsButton();
      }

      window.selectedTranslationsCountUpdate();
    });

    // translation checkbox change
    $(".table-list").on("change", ".js-check-all-translation", function () {
      var translationId = $(this).val();
      var checked = $(this).prop("checked");

      // uncheck "select all", if one of the listed checkbox item is unchecked
      if ($(this).prop("checked") === false) {
        $(".js-check-all").prop("checked", false);
      }
      // check "select all" if all checkbox translations are checked
      if ($(".js-check-all-translation:checked").length === $(".js-check-all-translation").length) {
        $(".js-check-all").prop("checked", true);
        showBulkActionsButton();
      }

      if ($(this).prop("checked")) {
        showBulkActionsButton();
        $(this).closest("tr").addClass("selected");
      } else {
        hideBulkActionsButton();
        $(this).closest("tr").removeClass("selected");
      }

      if ($(".js-check-all-translation:checked").length === 0) {
        hideBulkActionsButton();
      }

      $(".js-bulk-action-form").find(".js-translation-id-" + translationId).prop("checked", checked);
      window.selectedTranslationCountUpdate();
    });

    $(".js-cancel-bulk-action").on("click", function () {
      window.hideBulkActionForms();
      showBulkActionsButton();
      window.showOtherActionsButtons();
    });
  }
});
