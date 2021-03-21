"use strict";

(function () {
  var $scope = $("#welcome-notification-details");

  var $sendNotificationCheckbox = $("#organization_send_welcome_notification", $scope);

  var $customizeCheckbox = $("#organization_customize_welcome_notification", $scope);

  var toggleVisibility = function toggleVisibility() {
    if ($sendNotificationCheckbox.is(":checked")) {
      $(".send-welcome-notification-details", $scope).show();
    } else {
      $(".send-welcome-notification-details", $scope).hide();
    }

    if ($customizeCheckbox.is(":checked")) {
      $(".customize-welcome-notification-details", $scope).show();
    } else {
      $(".customize-welcome-notification-details", $scope).hide();
    }
  };

  $($sendNotificationCheckbox).click(function () {
    return toggleVisibility();
  });
  $($customizeCheckbox).click(function () {
    return toggleVisibility();
  });

  toggleVisibility();
})();
