"use strict";

$(function () {
  var $notificationsBellIcon = $(".title-bar .topbar__notifications");
  var $wrapper = $(".wrapper");
  var $section = $wrapper.find("#notifications");
  var $noNotificationsText = $(".empty-notifications");
  var $pagination = $wrapper.find("ul.pagination");
  var FADEOUT_TIME = 500;

  var anyNotifications = function anyNotifications() {
    return $wrapper.find(".card--widget").length > 0;
  };
  var emptyNotifications = function emptyNotifications() {
    if (!anyNotifications()) {
      $section.remove();
      $noNotificationsText.removeClass("hide");
    }
  };

  $section.on("click", ".mark-as-read-button", function (event) {
    var $item = $(event.target).parents(".card--widget");
    $item.fadeOut(FADEOUT_TIME, function () {
      $item.remove();
      emptyNotifications();
    });
  });

  $wrapper.on("click", ".mark-all-as-read-button", function () {
    $section.fadeOut(FADEOUT_TIME, function () {
      $pagination.remove();
      $notificationsBellIcon.removeClass("is-active");
      $wrapper.find(".card--widget").remove();
      emptyNotifications();
    });
  });

  emptyNotifications();
});
