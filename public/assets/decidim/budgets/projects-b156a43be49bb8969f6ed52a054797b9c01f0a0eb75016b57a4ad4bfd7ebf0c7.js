"use strict";

$(function () {
  var checkProgressPosition = function checkProgressPosition() {
    var progressFix = document.querySelector("[data-progressbox-fixed]"),
        progressRef = document.querySelector("[data-progress-reference]"),
        progressVisibleClass = "is-progressbox-visible";

    if (!progressRef) {
      return;
    }

    var progressPosition = progressRef.getBoundingClientRect().bottom;
    if (progressPosition > 0) {
      progressFix.classList.remove(progressVisibleClass);
    } else {
      progressFix.classList.add(progressVisibleClass);
    }
  };

  window.addEventListener("scroll", checkProgressPosition);

  window.DecidimBudgets = window.DecidimBudgets || {};
  window.DecidimBudgets.checkProgressPosition = checkProgressPosition;
});
"use strict";

$(function () {
  var $projects = $("#projects, #project");
  var $budgetSummaryTotal = $(".budget-summary__total");
  var $budgetExceedModal = $("#budget-excess");
  var $budgetSummary = $(".budget-summary__progressbox");
  var totalBudget = parseInt($budgetSummaryTotal.attr("data-total-budget"), 10);

  var cancelEvent = function cancelEvent(event) {
    event.stopPropagation();
    event.preventDefault();
  };

  $projects.on("click", ".budget-list__action", function (event) {
    var currentBudget = parseInt($budgetSummary.attr("data-current-budget"), 10);
    var $currentTarget = $(event.currentTarget);
    var projectBudget = parseInt($currentTarget.attr("data-budget"), 10);

    if ($currentTarget.attr("disabled")) {
      cancelEvent(event);
    } else if ($currentTarget.attr("data-add") === "true" && currentBudget + projectBudget > totalBudget) {
      $budgetExceedModal.foundation("toggle");
      cancelEvent(event);
    }
  });

  if ($("#order-progress [data-toggle=budget-confirm]").length > 0) {
    (function () {
      var safeUrl = $(".budget-summary").attr("data-safe-url").split("?")[0];
      $(document).on("click", "a", function (event) {
        window.exitUrl = event.currentTarget.href;
      });
      $(document).on("submit", "form", function (event) {
        window.exitUrl = event.currentTarget.action;
      });

      window.onbeforeunload = function () {
        var currentBudget = parseInt($budgetSummary.attr("data-current-budget"), 10);
        var exitUrl = window.exitUrl;
        window.exitUrl = null;

        if (currentBudget === 0 || exitUrl && exitUrl.startsWith(safeUrl)) {
          return null;
        }

        return "";
      };
    })();
  }
});
