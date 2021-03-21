"use strict";

(function (exports) {
  var _window$Decidim$History = window.Decidim.History;
  var pushState = _window$Decidim$History.pushState;
  var registerCallback = _window$Decidim$History.registerCallback;

  var initializeListingOptionsMenu = function initializeListingOptionsMenu(options) {
    exports.$(document).on("click", options.containerSelector + " a", function (event) {
      var $target = $(event.target);

      $target.parents(".menu").find("a:first").text($target.text());

      pushState($target.attr("href"));
    });

    registerCallback(options.callbackName, function () {
      var url = window.location.toString();
      var match = url.match(/${options.urlParameter}=([^&]*)/);
      var $targetMenu = $(options.containerSelector + " .menu");
      var value = $targetMenu.find(".menu a:first").data(options.dataAttribute);

      if (match) {
        value = match[1];
      }

      var linkText = $targetMenu.find(".menu a[data-" + options.dataAttribute + "=\"" + value + "\"]").text();

      $targetMenu.find("a:first").text(linkText);
    });
  };

  exports.$(function () {
    initializeListingOptionsMenu({
      containerSelector: ".order-by",
      callbackName: "orders",
      urlParameter: "order",
      dataAttribute: "order"
    });
    initializeListingOptionsMenu({
      containerSelector: ".results-per-page",
      callbackName: "results_per_page",
      urlParameter: "per_page",
      dataAttribute: "per-page-option"
    });
  });
})(window);
