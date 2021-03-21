"use strict";

$(function () {
  var $search = $("#data_picker-autocomplete");
  var $results = $("#add-translations-results");
  var $template = $("template", $results);
  var $form = $search.parents("form");
  var xhr = null;
  var currentSearch = "";

  $search.on("keyup", function () {
    currentSearch = $search.val();
  });

  $search.autoComplete({
    minChars: 2,
    cache: 0,
    source: function source(term, response) {
      try {
        xhr.abort();
      } catch (exception) {
        xhr = null;
      }

      var url = $form.attr("action");
      xhr = $.getJSON(url, $form.serializeArray(), function (data) {
        response(data);
      });
    },
    renderItem: function renderItem(item, search) {
      var sanitizedSearch = search.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      var re = new RegExp("(" + sanitizedSearch.split(" ").join("|") + ")", "gi");
      var modelId = item[0];
      var title = item[1];
      // The terms are already escaped but when they are rendered to a data
      // attribute, they get unescaped when those values are used. The only
      // character we need to replace is the ampersand
      var value = title.replace(/&/g, "&amp;");

      var val = title + " - " + modelId;
      return "<div class=\"autocomplete-suggestion\" data-model-id=\"" + modelId + "\" data-val=\"" + value + "\">" + val.replace(re, "<b>$1</b>") + "</div>";
    },
    onSelect: function onSelect(event, term, item) {
      var $suggestions = $search.data("sc");
      var modelId = item.data("modelId");
      var title = item.data("val");

      var template = $template.html();
      template = template.replace(new RegExp("{{translation_key}}", "g"), modelId);
      template = template.replace(new RegExp("{{translation_term}}", "g"), title);
      var $newRow = $(template);
      $("table tbody", $results).append($newRow);
      $results.removeClass("hide");

      // Add it to the autocomplete form
      var $field = $("<input type=\"hidden\" name=\"keys[]\" value=\"" + modelId + "\">");
      $form.append($field);

      // Listen to the click event on the remove button
      $(".remove-translation-key", $newRow).on("click", function (ev) {
        ev.preventDefault();
        $newRow.remove();
        $field.remove();

        if ($("table tbody tr", $results).length < 1) {
          $results.addClass("hide");
        }
      });

      $search.val(currentSearch);
      setTimeout(function () {
        $("[data-model-id=\"" + modelId + "\"]", $suggestions).remove();
        $suggestions.show();
      }, 20);
    }
  });
});
