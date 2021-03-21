"use strict";

(function () {
  var $scope = $("#promoting-committee-details");

  var $promotingCommitteeCheckbox = $("#initiatives_type_promoting_committee_enabled", $scope);

  var $signatureType = $("#initiatives_type_signature_type");

  var $collectUserDataCheckbox = $("#initiatives_type_collect_user_extra_fields");

  var toggleVisibility = function toggleVisibility() {
    if ($promotingCommitteeCheckbox.is(":checked")) {
      $(".minimum-committee-members-details", $scope).show();
    } else {
      $(".minimum-committee-members-details", $scope).hide();
    }

    if ($signatureType.val() === "offline") {
      $("#initiatives_type_undo_online_signatures_enabled").parent().parent().hide();
    } else {
      $("#initiatives_type_undo_online_signatures_enabled").parent().parent().show();
    }

    if ($collectUserDataCheckbox.is(":checked")) {
      $("#initiatives_type-extra_fields_legal_information-tabs").parent().parent().show();
    } else {
      $("#initiatives_type-extra_fields_legal_information-tabs").parent().parent().hide();
    }
  };

  $($promotingCommitteeCheckbox).click(function () {
    return toggleVisibility();
  });
  $($signatureType).change(function () {
    return toggleVisibility();
  });
  $($collectUserDataCheckbox).click(function () {
    return toggleVisibility();
  });

  toggleVisibility();
})();
