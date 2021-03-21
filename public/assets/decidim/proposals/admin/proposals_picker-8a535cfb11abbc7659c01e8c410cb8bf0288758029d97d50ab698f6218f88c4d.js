"use strict";

$(function () {
  var $content = $(".picker-content"),
      pickerMore = $content.data("picker-more"),
      pickerPath = $content.data("picker-path"),
      toggleNoProposals = function toggleNoProposals() {
    var showNoProposals = $("#proposals_list li:visible").length === 0;
    $("#no_proposals").toggle(showNoProposals);
  };

  var jqxhr = null;

  toggleNoProposals();

  $(".data_picker-modal-content").on("change keyup", "#proposals_filter", function (event) {
    var filter = event.target.value.toLowerCase();

    if (pickerMore) {
      if (jqxhr !== null) {
        jqxhr.abort();
      }

      $content.html("<div class='loading-spinner'></div>");
      jqxhr = $.get(pickerPath + "?q=" + filter, function (data) {
        $content.html(data);
        jqxhr = null;
        toggleNoProposals();
      });
    } else {
      $("#proposals_list li").each(function (index, li) {
        $(li).toggle(li.textContent.toLowerCase().indexOf(filter) > -1);
      });
      toggleNoProposals();
    }
  });
});
