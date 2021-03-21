"use strict";

(function () {
  $("button.collapse-all").on("click", function () {
    $(".collapsible").addClass("hide");
    $(".question--collapse .icon-expand").removeClass("hide");
    $(".question--collapse .icon-collapse").addClass("hide");
  });

  $("button.expand-all").on("click", function () {
    $(".collapsible").removeClass("hide");
    $(".question--collapse .icon-expand").addClass("hide");
    $(".question--collapse .icon-collapse").removeClass("hide");
  });
})(window);
