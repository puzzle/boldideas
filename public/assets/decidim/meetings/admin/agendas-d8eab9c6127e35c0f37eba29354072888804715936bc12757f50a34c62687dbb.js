"use strict";

(function (exports) {
  var _exports$DecidimAdmin = exports.DecidimAdmin;
  var AutoLabelByPositionComponent = _exports$DecidimAdmin.AutoLabelByPositionComponent;
  var AutoButtonsByPositionComponent = _exports$DecidimAdmin.AutoButtonsByPositionComponent;
  var createDynamicFields = _exports$DecidimAdmin.createDynamicFields;
  var createSortList = _exports$DecidimAdmin.createSortList;
  var createQuillEditor = exports.Decidim.createQuillEditor;

  var wrapperSelector = ".meeting-agenda-items";
  var fieldSelector = ".meeting-agenda-item";
  var childsWrapperSelector = ".meeting-agenda-item-childs";
  var childFieldSelector = ".meeting-agenda-item-child";

  var autoLabelByPosition = new AutoLabelByPositionComponent({
    listSelector: ".meeting-agenda-item:not(.hidden)",
    labelSelector: ".card-title span:first",
    onPositionComputed: function onPositionComputed(el, idx) {
      $(el).find("input[name$=\\[position\\]]").val(idx);
    }
  });

  var autoButtonsByPosition = new AutoButtonsByPositionComponent({
    listSelector: ".meeting-agenda-item:not(.hidden)",
    hideOnFirstSelector: ".move-up-agenda-item",
    hideOnLastSelector: ".move-down-agenda-item"
  });

  var createSortableList = function createSortableList() {
    createSortList(".meeting-agenda-items-list:not(.published)", {
      handle: ".agenda-item-divider",
      placeholder: '<div style="border-style: dashed; border-color: #000"></div>',
      forcePlaceholderSize: true,
      onSortUpdate: function onSortUpdate() {
        autoLabelByPosition.run();
      }
    });
  };

  var createSortableListChild = function createSortableListChild() {
    createSortList(".meeting-agenda-item-childs-list:not(.published)", {
      handle: ".agenda-item-child-divider",
      placeholder: '<div style="border-style: dashed; border-color: #000"></div>',
      forcePlaceholderSize: true,
      onSortUpdate: function onSortUpdate() {
        autoLabelByPosition.run();
      }
    });
  };

  var autoLabelByPositionChild = new AutoLabelByPositionComponent({
    listSelector: ".meeting-agenda-item-child:not(.hidden)",
    labelSelector: ".card-title span:first",
    onPositionComputed: function onPositionComputed(el, idx) {
      $(el).find("input[name$=\\[position\\]]").val(idx);
    }
  });

  var autoButtonsByPositionChild = new AutoButtonsByPositionComponent({
    listSelector: ".meeting-agenda-item-child:not(.hidden)",
    hideOnFirstSelector: ".move-up-agenda-item-child",
    hideOnLastSelector: ".move-down-agenda-item-child"
  });

  var createDynamicFieldsForAgendaItemChilds = function createDynamicFieldsForAgendaItemChilds(fieldId) {
    return createDynamicFields({
      placeholderId: "meeting-agenda-item-child-id",
      wrapperSelector: "#" + fieldId + " " + childsWrapperSelector,
      containerSelector: ".meeting-agenda-item-childs-list",
      fieldSelector: childFieldSelector,
      addFieldButtonSelector: ".add-agenda-item-child",
      removeFieldButtonSelector: ".remove-agenda-item-child",
      moveUpFieldButtonSelector: ".move-up-agenda-item-child",
      moveDownFieldButtonSelector: ".move-down-agenda-item-child",

      onAddField: function onAddField($field) {
        createSortableListChild();

        $field.find(".editor-container").each(function (idx, el) {
          createQuillEditor(el);
        });

        autoLabelByPositionChild.run();
        autoButtonsByPositionChild.run();
      },
      onRemoveField: function onRemoveField() {
        autoLabelByPositionChild.run();
        autoButtonsByPositionChild.run();
      },
      onMoveUpField: function onMoveUpField() {
        autoLabelByPositionChild.run();
        autoButtonsByPositionChild.run();
      },
      onMoveDownField: function onMoveDownField() {
        autoLabelByPositionChild.run();
        autoButtonsByPositionChild.run();
      }
    });
  };

  var dynamicFieldsForAgendaItemChilds = {};

  var setupInitialAgendaItemChildAttributes = function setupInitialAgendaItemChildAttributes($target) {
    var fieldId = $target.attr("id");

    dynamicFieldsForAgendaItemChilds[fieldId] = createDynamicFieldsForAgendaItemChilds(fieldId);
  };

  var hideDeletedAgendaItem = function hideDeletedAgendaItem($target) {
    var inputDeleted = $target.find("input[name$=\\[deleted\\]]").val();

    if (inputDeleted === "true") {
      $target.addClass("hidden");
      $target.hide();
    }
  };

  createDynamicFields({
    placeholderId: "meeting-agenda-item-id",
    wrapperSelector: wrapperSelector,
    containerSelector: ".meeting-agenda-items-list",
    fieldSelector: fieldSelector,
    addFieldButtonSelector: ".add-agenda-item",
    removeFieldButtonSelector: ".remove-agenda-item",
    moveUpFieldButtonSelector: ".move-up-agenda-item",
    moveDownFieldButtonSelector: ".move-down-agenda-item",
    onAddField: function onAddField($field) {
      // createDynamicFieldsForAgendaItemChilds($field);
      setupInitialAgendaItemChildAttributes($field);
      createSortableList();

      $field.find(".editor-container").each(function (idx, el) {
        createQuillEditor(el);
      });

      autoLabelByPosition.run();
      autoButtonsByPosition.run();
    },
    onRemoveField: function onRemoveField() {
      autoLabelByPosition.run();
      autoButtonsByPosition.run();
    },
    onMoveUpField: function onMoveUpField() {
      autoLabelByPosition.run();
      autoButtonsByPosition.run();
    },
    onMoveDownField: function onMoveDownField() {
      autoLabelByPosition.run();
      autoButtonsByPosition.run();
    }
  });

  createSortableList();

  $(fieldSelector).each(function (idx, el) {
    var $target = $(el);

    hideDeletedAgendaItem($target);
    setupInitialAgendaItemChildAttributes($target);
  });

  autoLabelByPosition.run();
  autoButtonsByPosition.run();
  autoLabelByPositionChild.run();
  autoButtonsByPositionChild.run();
})(window);
