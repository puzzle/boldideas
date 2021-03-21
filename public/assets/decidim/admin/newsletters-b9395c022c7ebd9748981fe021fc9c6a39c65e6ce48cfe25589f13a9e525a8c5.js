"use strict";

$(function () {
  var $form = $(".form.newsletter_deliver");

  if ($form.length > 0) {
    (function () {
      var $sendNewsletterToAllUsers = $form.find("#send_newsletter_to_all_users");
      var $sendNewsletterToFollowers = $form.find("#send_newsletter_to_followers");
      var $sendNewsletterToParticipants = $form.find("#send_newsletter_to_participants");
      var $participatorySpacesForSelect = $form.find("#participatory_spaces_for_select");

      var checkSelectiveNewsletterFollowers = $sendNewsletterToFollowers.find("input[type='checkbox']").prop("checked");
      var checkSelectiveNewsletterParticipants = $sendNewsletterToParticipants.find("input[type='checkbox']").prop("checked");

      $sendNewsletterToAllUsers.on("change", function (event) {
        var checked = event.target.checked;
        if (checked) {
          $sendNewsletterToFollowers.find("input[type='checkbox']").prop("checked", !checked);
          $sendNewsletterToParticipants.find("input[type='checkbox']").prop("checked", !checked);
          $participatorySpacesForSelect.hide();
        } else {
          $sendNewsletterToFollowers.find("input[type='checkbox']").prop("checked", !checked);
          $sendNewsletterToParticipants.find("input[type='checkbox']").prop("checked", !checked);
          $participatorySpacesForSelect.show();
        }
      });

      $sendNewsletterToFollowers.on("change", function (event) {
        var checked = event.target.checked;
        var selectiveNewsletterParticipants = $sendNewsletterToParticipants.find("input[type='checkbox']").prop("checked");

        if (checked) {
          $sendNewsletterToAllUsers.find("input[type='checkbox']").prop("checked", !checked);
          $participatorySpacesForSelect.show();
        } else if (!selectiveNewsletterParticipants) {
          $sendNewsletterToAllUsers.find("input[type='checkbox']").prop("checked", true);
          $participatorySpacesForSelect.hide();
        }
      });

      $sendNewsletterToParticipants.on("change", function (event) {
        var checked = event.target.checked;
        var selectiveNewsletterFollowers = $sendNewsletterToFollowers.find("input[type='checkbox']").prop("checked");
        if (checked) {
          $sendNewsletterToAllUsers.find("input[type='checkbox']").prop("checked", !checked);
          $participatorySpacesForSelect.show();
        } else if (!selectiveNewsletterFollowers) {
          $sendNewsletterToAllUsers.find("input[type='checkbox']").prop("checked", true);
          $participatorySpacesForSelect.hide();
        }
      });

      if (checkSelectiveNewsletterFollowers || checkSelectiveNewsletterParticipants) {
        $participatorySpacesForSelect.show();
      } else {
        $participatorySpacesForSelect.hide();
      }

      $(".form .spaces-block-tag").each(function (_i, blockTag) {
        var selectTag = $(blockTag).find(".chosen-select");
        selectTag.change(function () {
          var optionSelected = selectTag.find("option:selected").val();
          if (optionSelected === "all") {
            selectTag.find("option").not(":first").prop("selected", true);
            selectTag.find("option[value='all']").prop("selected", false);
          } else if (optionSelected === "") {
            selectTag.find("option").not(":first").prop("selected", false);
          }
        });
      });

      $form.on("change", function () {
        var $data = $form.serializeJSON().newsletter;
        var $url = $form.data("recipients-count-newsletter-path");
        var $modal = $("#recipients_count_spinner");
        $modal.removeClass("hide");
        $.get($url, { data: $data }, function (recipientsCount) {
          $("#recipients_count").text(recipientsCount);
        }).always(function () {
          $modal.addClass("hide");
        });
      });
    })();
  }
});
