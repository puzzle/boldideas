"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var AutoButtonsByPositionComponent = (function () {
    function AutoButtonsByPositionComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, AutoButtonsByPositionComponent);

      this.listSelector = options.listSelector;
      this.hideOnFirstSelector = options.hideOnFirstSelector;
      this.hideOnLastSelector = options.hideOnLastSelector;

      this.run();
    }

    _createClass(AutoButtonsByPositionComponent, [{
      key: "run",
      value: function run() {
        var $list = $(this.listSelector);
        var hideOnFirst = this.hideOnFirstSelector;
        var hideOnLast = this.hideOnLastSelector;

        if ($list.length === 1) {
          var $item = $list.first();

          $item.find(hideOnFirst).hide();
          $item.find(hideOnLast).hide();
        } else {
          $list.each(function (idx, el) {
            if (el.id === $list.first().attr("id")) {
              $(el).find(hideOnFirst).hide();
              $(el).find(hideOnLast).show();
            } else if (el.id === $list.last().attr("id")) {
              $(el).find(hideOnLast).hide();
              $(el).find(hideOnFirst).show();
            } else {
              $(el).find(hideOnLast).show();
              $(el).find(hideOnFirst).show();
            }
          });
        }
      }
    }]);

    return AutoButtonsByPositionComponent;
  })();

  exports.DecidimAdmin = exports.DecidimAdmin || {};
  exports.DecidimAdmin.AutoButtonsByPositionComponent = AutoButtonsByPositionComponent;
})(window);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var AutoLabelByPositionComponent = (function () {
    function AutoLabelByPositionComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, AutoLabelByPositionComponent);

      this.listSelector = options.listSelector;
      this.labelSelector = options.labelSelector;
      this.onPositionComputed = options.onPositionComputed;

      this.run();
    }

    _createClass(AutoLabelByPositionComponent, [{
      key: "run",
      value: function run() {
        var _this = this;

        var $list = $(this.listSelector);

        $list.each(function (idx, el) {
          var $label = $(el).find(_this.labelSelector);
          var labelContent = $label.html();

          if (labelContent.match(/#(\d+)/)) {
            $label.html(labelContent.replace(/#(\d+)/, "#" + (idx + 1)));
          } else {
            $label.html(labelContent + " #" + (idx + 1));
          }

          if (_this.onPositionComputed) {
            _this.onPositionComputed(el, idx);
          }
        });
      }
    }]);

    return AutoLabelByPositionComponent;
  })();

  exports.DecidimAdmin = exports.DecidimAdmin || {};
  exports.DecidimAdmin.AutoLabelByPositionComponent = AutoLabelByPositionComponent;
})(window);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var DynamicFieldsComponent = (function () {
    function DynamicFieldsComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, DynamicFieldsComponent);

      this.wrapperSelector = options.wrapperSelector;
      this.containerSelector = options.containerSelector;
      this.fieldSelector = options.fieldSelector;
      this.addFieldButtonSelector = options.addFieldButtonSelector;
      this.addSeparatorButtonSelector = options.addSeparatorButtonSelector;
      this.fieldTemplateSelector = options.fieldTemplateSelector;
      this.separatorTemplateSelector = options.separatorTemplateSelector;
      this.removeFieldButtonSelector = options.removeFieldButtonSelector;
      this.moveUpFieldButtonSelector = options.moveUpFieldButtonSelector;
      this.moveDownFieldButtonSelector = options.moveDownFieldButtonSelector;
      this.onAddField = options.onAddField;
      this.onRemoveField = options.onRemoveField;
      this.onMoveUpField = options.onMoveUpField;
      this.onMoveDownField = options.onMoveDownField;
      this.placeholderId = options.placeholderId;
      this.elementCounter = 0;
      this._enableInterpolation();
      this._activateFields();
      this._bindEvents();
    }

    _createClass(DynamicFieldsComponent, [{
      key: "_enableInterpolation",
      value: function _enableInterpolation() {
        $.fn.replaceAttribute = function (attribute, placeholder, value) {
          $(this).find("[" + attribute + "*=" + placeholder + "]").addBack("[" + attribute + "*=" + placeholder + "]").each(function (index, element) {
            $(element).attr(attribute, $(element).attr(attribute).replace(placeholder, value));
          });

          return this;
        };

        $.fn.template = function (placeholder, value) {
          // See the comment below in the `_addField()` method regarding the
          // `<template>` tag support in IE11.
          var $subtemplate = $(this).find("template, .decidim-template");

          if ($subtemplate.length > 0) {
            $subtemplate.html(function (index, oldHtml) {
              return $(oldHtml).template(placeholder, value)[0].outerHTML;
            });
          }

          // Handle those subtemplates that are mapped with the `data-template`
          // attribute. This is also because of the IE11 support.
          var $subtemplateParents = $(this).find("[data-template]");

          if ($subtemplateParents.length > 0) {
            $subtemplateParents.each(function (_i, elem) {
              var $self = $(elem);
              var $tpl = $($self.data("template"));

              // Duplicate the sub-template with a unique ID as there may be
              // multiple parent templates referring to the same sub-template.
              var $subtpl = $($tpl[0].outerHTML);
              var subtemplateId = $tpl.attr("id") + "-" + value;
              var subtemplateSelector = "#" + subtemplateId;
              $subtpl.attr("id", subtemplateId);
              $self.attr("data-template", subtemplateSelector).data("template", subtemplateSelector);
              $tpl.after($subtpl);

              $subtpl.html(function (index, oldHtml) {
                return $(oldHtml).template(placeholder, value)[0].outerHTML;
              });
            });
          }

          $(this).replaceAttribute("id", placeholder, value);
          $(this).replaceAttribute("name", placeholder, value);
          $(this).replaceAttribute("data-tabs-content", placeholder, value);
          $(this).replaceAttribute("for", placeholder, value);
          $(this).replaceAttribute("tabs_id", placeholder, value);
          $(this).replaceAttribute("href", placeholder, value);

          return this;
        };
      }
    }, {
      key: "_bindEvents",
      value: function _bindEvents() {
        var _this = this;

        $(this.wrapperSelector).on("click", this.addFieldButtonSelector, function (event) {
          return _this._bindSafeEvent(event, function () {
            return _this._addField(_this.fieldTemplateSelector);
          });
        });

        if (this.addSeparatorButtonSelector) {
          $(this.wrapperSelector).on("click", this.addSeparatorButtonSelector, function (event) {
            return _this._bindSafeEvent(event, function () {
              return _this._addField(_this.separatorTemplateSelector);
            });
          });
        }

        $(this.wrapperSelector).on("click", this.removeFieldButtonSelector, function (event) {
          return _this._bindSafeEvent(event, function (target) {
            return _this._removeField(target);
          });
        });

        if (this.moveUpFieldButtonSelector) {
          $(this.wrapperSelector).on("click", this.moveUpFieldButtonSelector, function (event) {
            return _this._bindSafeEvent(event, function (target) {
              return _this._moveUpField(target);
            });
          });
        }

        if (this.moveDownFieldButtonSelector) {
          $(this.wrapperSelector).on("click", this.moveDownFieldButtonSelector, function (event) {
            return _this._bindSafeEvent(event, function (target) {
              return _this._moveDownField(target);
            });
          });
        }
      }
    }, {
      key: "_bindSafeEvent",
      value: function _bindSafeEvent(event, cb) {
        event.preventDefault();
        event.stopPropagation();

        try {
          return cb(event.target);
        } catch (error) {
          console.error(error); // eslint-disable-line no-console
          return error;
        }
      }

      // Adds a field.
      //
      // template - A String matching the type of the template. Expected to be
      //  either ".decidim-question-template" or ".decidim-separator-template".
    }, {
      key: "_addField",
      value: function _addField() {
        var templateClass = arguments.length <= 0 || arguments[0] === undefined ? ".decidim-template" : arguments[0];

        var $wrapper = $(this.wrapperSelector);
        var $container = $wrapper.find(this.containerSelector);

        // Allow defining the template using a `data-template` attribute on the
        // wrapper element. This is to allow child templates which would otherwise
        // be impossible using `<script type="text/template">`. See the comment
        // below regarding the `<template>` tag and IE11.
        var templateSelector = $wrapper.data("template");
        var $template = null;
        if (templateSelector) {
          $template = $(templateSelector);
        }
        if ($template === null || $template.length < 1) {
          // To preserve IE11 backwards compatibility, the views are using
          // `<script type="text/template">` with a given `class` instead of
          // `<template>`. The `<template> tags are parsed in IE11 along with the
          // DOM which may cause the form elements inside them to break the forms
          // as they are submitted with them.
          $template = $wrapper.children("template, " + templateClass);
        }

        var $newField = $($template.html()).template(this.placeholderId, this._getUID());

        $newField.find("ul.tabs").attr("data-tabs", true);

        var $lastQuestion = $container.find(this.fieldSelector).last();
        if ($lastQuestion.length > 0) {
          $lastQuestion.after($newField);
        } else {
          $newField.appendTo($container);
        }

        $newField.foundation();

        if (this.onAddField) {
          this.onAddField($newField);
        }
      }
    }, {
      key: "_removeField",
      value: function _removeField(target) {
        var $target = $(target);
        var $removedField = $target.parents(this.fieldSelector);
        var idInput = $removedField.find("input").filter(function (idx, input) {
          return input.name.match(/id/);
        });

        if (idInput.length > 0) {
          var deletedInput = $removedField.find("input").filter(function (idx, input) {
            return input.name.match(/delete/);
          });

          if (deletedInput.length > 0) {
            $(deletedInput[0]).val(true);
          }

          $removedField.addClass("hidden");
          $removedField.hide();
        } else {
          $removedField.remove();
        }

        if (this.onRemoveField) {
          this.onRemoveField($removedField);
        }
      }
    }, {
      key: "_moveUpField",
      value: function _moveUpField(target) {
        var $target = $(target);
        var $movedUpField = $target.parents(this.fieldSelector);

        $movedUpField.prev().before($movedUpField);

        if (this.onMoveUpField) {
          this.onMoveUpField($movedUpField);
        }
      }
    }, {
      key: "_moveDownField",
      value: function _moveDownField(target) {
        var $target = $(target);
        var $movedDownField = $target.parents(this.fieldSelector);

        $movedDownField.next().after($movedDownField);

        if (this.onMoveDownField) {
          this.onMoveDownField($movedDownField);
        }
      }
    }, {
      key: "_activateFields",
      value: function _activateFields() {
        var _this2 = this;

        // Move the `<script type="text/template">` elements to the bottom of the
        // list container so that they will not cause the question moving
        // functionality to break since it assumes that all children elements are
        // the dynamic field list child items.
        var $wrapper = $(this.wrapperSelector);
        var $container = $wrapper.find(this.containerSelector);
        $container.append($container.find("script"));

        $(this.fieldSelector).each(function (idx, el) {
          $(el).template(_this2.placeholderId, _this2._getUID());

          $(el).find("ul.tabs").attr("data-tabs", true);
        });
      }
    }, {
      key: "_getUID",
      value: function _getUID() {
        this.elementCounter += 1;

        return new Date().getTime() + this.elementCounter;
      }
    }]);

    return DynamicFieldsComponent;
  })();

  exports.DecidimAdmin = exports.DecidimAdmin || {};
  exports.DecidimAdmin.DynamicFieldsComponent = DynamicFieldsComponent;
  exports.DecidimAdmin.createDynamicFields = function (options) {
    return new DynamicFieldsComponent(options);
  };
})(window);
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.sortable = factory();
  }
}(this, function() {
/*
 * HTML5 Sortable library
 * https://github.com/voidberg/html5sortable
 *
 * Original code copyright 2012 Ali Farhadi.
 * This version is mantained by Alexandru Badiu <andu@ctrlz.ro> & Lukas Oppermann <lukas@vea.re>
 * jQuery-independent implementation by Nazar Mokrynskyi <nazar@mokrynskyi.com>
 *
 * Released under the MIT license.
 */
'use strict';
/*
 * variables global to the plugin
 */
var dragging;
var draggingHeight;
var placeholders = [];
var sortables = [];
/**
 * Get or set data on element
 * @param {Element} element
 * @param {string} key
 * @param {*} value
 * @return {*}
 */
var _data = function(element, key, value) {
  if (value === undefined) {
    return element && element.h5s && element.h5s.data && element.h5s.data[key];
  } else {
    element.h5s = element.h5s || {};
    element.h5s.data = element.h5s.data || {};
    element.h5s.data[key] = value;
  }
};
/**
 * Remove data from element
 * @param {Element} element
 */
var _removeData = function(element) {
  if (element.h5s) {
    delete element.h5s.data;
  }
};
/**
 * Cross-browser shortcut for actual `Element.matches` method,
 * which has vendor prefix in older browsers
 */
var matches;
switch (true) {
  case 'matches' in window.Element.prototype:
    matches = 'matches';
    break;
  case 'mozMatchesSelector' in window.Element.prototype:
    matches = 'mozMatchesSelector';
    break;
  case 'msMatchesSelector' in window.Element.prototype:
    matches = 'msMatchesSelector';
    break;
  case 'webkitMatchesSelector' in window.Element.prototype:
    matches = 'webkitMatchesSelector';
    break;
}
/**
 * Filter only wanted nodes
 * @param {Array|NodeList} nodes
 * @param {Array/string} wanted
 * @returns {Array}
 */
var _filter = function(nodes, wanted) {
  if (!wanted) {
    return Array.prototype.slice.call(nodes);
  }
  var result = [];
  for (var i = 0; i < nodes.length; ++i) {
    if (typeof wanted === 'string' && nodes[i][matches](wanted)) {
      result.push(nodes[i]);
    }
    if (wanted.indexOf(nodes[i]) !== -1) {
      result.push(nodes[i]);
    }
  }
  return result;
};
/**
 * @param {Array|Element} element
 * @param {Array|string} event
 * @param {Function} callback
 */
var _on = function(element, event, callback) {
  if (element instanceof Array) {
    for (var i = 0; i < element.length; ++i) {
      _on(element[i], event, callback);
    }
    return;
  }
  element.addEventListener(event, callback);
  element.h5s = element.h5s || {};
  element.h5s.events = element.h5s.events || {};
  element.h5s.events[event] = callback;
};
/**
 * @param {Array|Element} element
 * @param {Array|string} event
 */
var _off = function(element, event) {
  if (element instanceof Array) {
    for (var i = 0; i < element.length; ++i) {
      _off(element[i], event);
    }
    return;
  }
  if (element.h5s && element.h5s.events && element.h5s.events[event]) {
    element.removeEventListener(event, element.h5s.events[event]);
    delete element.h5s.events[event];
  }
};
/**
 * @param {Array|Element} element
 * @param {string} attribute
 * @param {*} value
 */
var _attr = function(element, attribute, value) {
  if (element instanceof Array) {
    for (var i = 0; i < element.length; ++i) {
      _attr(element[i], attribute, value);
    }
    return;
  }
  element.setAttribute(attribute, value);
};
/**
 * @param {Array|Element} element
 * @param {string} attribute
 */
var _removeAttr = function(element, attribute) {
  if (element instanceof Array) {
    for (var i = 0; i < element.length; ++i) {
      _removeAttr(element[i], attribute);
    }
    return;
  }
  element.removeAttribute(attribute);
};
/**
 * @param {Element} element
 * @returns {{left: *, top: *}}
 */
var _offset = function(element) {
  var rect = element.getClientRects()[0];
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY
  };
};
/*
 * remove event handlers from items
 * @param {Array|NodeList} items
 */
var _removeItemEvents = function(items) {
  _off(items, 'dragstart');
  _off(items, 'dragend');
  _off(items, 'selectstart');
  _off(items, 'dragover');
  _off(items, 'dragenter');
  _off(items, 'drop');
};
/*
 * Remove event handlers from sortable
 * @param {Element} sortable a single sortable
 */
var _removeSortableEvents = function(sortable) {
  _off(sortable, 'dragover');
  _off(sortable, 'dragenter');
  _off(sortable, 'drop');
};
/*
 * Attach ghost to dataTransfer object
 * @param {Event} original event
 * @param {object} ghost-object with item, x and y coordinates
 */
var _attachGhost = function(event, ghost) {
  // this needs to be set for HTML5 drag & drop to work
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text', '');

  // check if setDragImage method is available
  if (event.dataTransfer.setDragImage) {
    event.dataTransfer.setDragImage(ghost.draggedItem, ghost.x, ghost.y);
  }
};
/**
 * _addGhostPos clones the dragged item and adds it as a Ghost item
 * @param {Event} event - the event fired when dragstart is triggered
 * @param {object} ghost - .draggedItem = Element
 */
var _addGhostPos = function(event, ghost) {
  if (!ghost.x) {
    ghost.x = parseInt(event.pageX - _offset(ghost.draggedItem).left);
  }
  if (!ghost.y) {
    ghost.y = parseInt(event.pageY - _offset(ghost.draggedItem).top);
  }
  return ghost;
};
/**
 * _makeGhost decides which way to make a ghost and passes it to attachGhost
 * @param {Element} draggedItem - the item that the user drags
 */
var _makeGhost = function(draggedItem) {
  return {
    draggedItem: draggedItem
  };
};
/**
 * _getGhost constructs ghost and attaches it to dataTransfer
 * @param {Event} event - the original drag event object
 * @param {Element} draggedItem - the item that the user drags
 */
// TODO: could draggedItem be replaced by event.target in all instances
var _getGhost = function(event, draggedItem) {
  // add ghost item & draggedItem to ghost object
  var ghost = _makeGhost(draggedItem);
  // attach ghost position
  ghost = _addGhostPos(event, ghost);
  // attach ghost to dataTransfer
  _attachGhost(event, ghost);
};
/*
 * Remove data from sortable
 * @param {Element} sortable a single sortable
 */
var _removeSortableData = function(sortable) {
  _removeData(sortable);
  _removeAttr(sortable, 'aria-dropeffect');
};
/*
 * Remove data from items
 * @param {Array|Element} items
 */
var _removeItemData = function(items) {
  _removeAttr(items, 'aria-grabbed');
  _removeAttr(items, 'draggable');
  _removeAttr(items, 'role');
};
/*
 * Check if two lists are connected
 * @param {Element} curList
 * @param {Element} destList
 */
var _listsConnected = function(curList, destList) {
  if (curList === destList) {
    return true;
  }
  if (_data(curList, 'connectWith') !== undefined) {
    return _data(curList, 'connectWith') === _data(destList, 'connectWith');
  }
  return false;
};
var _getHandles = function(items, handle) {
  var result = [];
  var handles;
  if (!handle) {
    return items;
  }
  for (var i = 0; i < items.length; ++i) {
    handles = items[i].querySelectorAll(handle);
    result = result.concat(Array.prototype.slice.call(handles));
  }
  return result;
};
/*
 * Destroy the sortable
 * @param {Element} sortableElement a single sortable
 */
var _destroySortable = function(sortableElement) {
  var opts = _data(sortableElement, 'opts') || {};
  var items = _filter(sortableElement.children, opts.items);
  var handles = _getHandles(items, opts.handle);
  // remove event handlers & data from sortable
  _removeSortableEvents(sortableElement);
  _removeSortableData(sortableElement);
  // remove event handlers & data from items
  _off(handles, 'mousedown');
  _removeItemEvents(items);
  _removeItemData(items);
};
/*
 * Enable the sortable
 * @param {Element} sortableElement a single sortable
 */
var _enableSortable = function(sortableElement) {
  var opts = _data(sortableElement, 'opts');
  var items = _filter(sortableElement.children, opts.items);
  var handles = _getHandles(items, opts.handle);
  _attr(sortableElement, 'aria-dropeffect', 'move');
  _attr(handles, 'draggable', 'true');
  // IE FIX for ghost
  // can be disabled as it has the side effect that other events
  // (e.g. click) will be ignored
  var spanEl = (document || window.document).createElement('span');
  if (typeof spanEl.dragDrop === 'function' && !opts.disableIEFix) {
    _on(handles, 'mousedown', function() {
      if (items.indexOf(this) !== -1) {
        this.dragDrop();
      } else {
        var parent = this.parentElement;
        while (items.indexOf(parent) === -1) {
          parent = parent.parentElement;
        }
        parent.dragDrop();
      }
    });
  }
};
/*
 * Disable the sortable
 * @param {Element} sortableElement a single sortable
 */
var _disableSortable = function(sortableElement) {
  var opts = _data(sortableElement, 'opts');
  var items = _filter(sortableElement.children, opts.items);
  var handles = _getHandles(items, opts.handle);
  _attr(sortableElement, 'aria-dropeffect', 'none');
  _attr(handles, 'draggable', 'false');
  _off(handles, 'mousedown');
};
/*
 * Reload the sortable
 * @param {Element} sortableElement a single sortable
 * @description events need to be removed to not be double bound
 */
var _reloadSortable = function(sortableElement) {
  var opts = _data(sortableElement, 'opts');
  var items = _filter(sortableElement.children, opts.items);
  var handles = _getHandles(items, opts.handle);
  // remove event handlers from items
  _removeItemEvents(items);
  _off(handles, 'mousedown');
  // remove event handlers from sortable
  _removeSortableEvents(sortableElement);
};
/**
 * Get position of the element relatively to its sibling elements
 * @param {Element} element
 * @returns {number}
 */
var _index = function(element) {
  if (!element.parentElement) {
    return 0;
  }
  return Array.prototype.indexOf.call(element.parentElement.children, element);
};
/**
 * Whether element is in DOM
 * @param {Element} element
 * @returns {boolean}
 */
var _attached = function(element) {
  return !!element.parentNode;
};
/**
 * Convert HTML string into DOM element
 * @param {Element|string} html
 * @returns {Element}
 */
var _html2element = function(html) {
  if (typeof html !== 'string') {
    return html;
  }
  var div = document.createElement('div');
  div.innerHTML	= html;
  return div.firstChild;
};
/**
 * Insert before target
 * @param {Element} target
 * @param {Element} element
 */
var _before = function(target, element) {
  target.parentElement.insertBefore(
    element,
    target
  );
};
/**
 * Insert after target
 * @param {Element} target
 * @param {Element} element
 */
var _after = function(target, element) {
  target.parentElement.insertBefore(
    element,
    target.nextElementSibling
  );
};
/**
 * Detach element from DOM
 * @param {Element} element
 */
var _detach = function(element) {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
};
/**
 * Make native event that can be dispatched afterwards
 * @param {string} name
 * @param {object} detail
 * @returns {CustomEvent}
 */
var _makeEvent = function(name, detail) {
  var e = document.createEvent('Event');
  if (detail) {
    e.detail = detail;
  }
  e.initEvent(name, false, true);
  return e;
};
/**
 * @param {Element} sortableElement
 * @param {CustomEvent} event
 */
var _dispatchEventOnConnected = function(sortableElement, event) {
  sortables.forEach(function(target) {
    if (_listsConnected(sortableElement, target)) {
      target.dispatchEvent(event);
    }
  });
};
/*
 * Public sortable object
 * @param {Array|NodeList} sortableElements
 * @param {object|string} options|method
 */
var sortable = function(sortableElements, options) {

  var method = String(options);

  options = (function(options) {
    var result = {
      connectWith: false,
      placeholder: null,
      // dragImage can be null or a Element
      dragImage: null,
      disableIEFix: false,
      placeholderClass: 'sortable-placeholder',
      draggingClass: 'sortable-dragging',
      hoverClass: false
    };
    for (var option in options) {
      result[option] = options[option];
    }
    return result;
  })(options);

  if (typeof sortableElements === 'string') {
    sortableElements = document.querySelectorAll(sortableElements);
  }

  if (sortableElements instanceof window.Element) {
    sortableElements = [sortableElements];
  }

  sortableElements = Array.prototype.slice.call(sortableElements);

  /* TODO: maxstatements should be 25, fix and remove line below */
  /*jshint maxstatements:false */
  sortableElements.forEach(function(sortableElement) {

    if (/enable|disable|destroy/.test(method)) {
      sortable[method](sortableElement);
      return;
    }

    // get options & set options on sortable
    options = _data(sortableElement, 'opts') || options;
    _data(sortableElement, 'opts', options);
    // reset sortable
    _reloadSortable(sortableElement);
    // initialize
    var items = _filter(sortableElement.children, options.items);
    var index;
    var startParent;
    var placeholder = options.placeholder;
    if (!placeholder) {
      placeholder = document.createElement(
        /^ul|ol$/i.test(sortableElement.tagName) ? 'li' : 'div'
      );
    }
    placeholder = _html2element(placeholder);
    placeholder.classList.add.apply(
      placeholder.classList,
      options.placeholderClass.split(' ')
    );

    // setup sortable ids
    if (!sortableElement.getAttribute('data-sortable-id')) {
      var id = sortables.length;
      sortables[id] = sortableElement;
      _attr(sortableElement, 'data-sortable-id', id);
      _attr(items, 'data-item-sortable-id', id);
    }

    _data(sortableElement, 'items', options.items);
    placeholders.push(placeholder);
    if (options.connectWith) {
      _data(sortableElement, 'connectWith', options.connectWith);
    }

    _enableSortable(sortableElement);
    _attr(items, 'role', 'option');
    _attr(items, 'aria-grabbed', 'false');

    // Mouse over class
    if (options.hoverClass) {
      var hoverClass = 'sortable-over';
      if (typeof options.hoverClass === 'string') {
        hoverClass = options.hoverClass;
      }

      _on(items, 'mouseenter', function() {
        this.classList.add(hoverClass);
      });
      _on(items, 'mouseleave', function() {
        this.classList.remove(hoverClass);
      });
    }

    // Handle drag events on draggable items
    _on(items, 'dragstart', function(e) {
      e.stopImmediatePropagation();

      if (options.dragImage) {
        _attachGhost(e, {
          draggedItem: options.dragImage,
          x: 0,
          y: 0
        });
        console.log('WARNING: dragImage option is deprecated' +
        ' and will be removed in the future!');
      } else {
        // add transparent clone or other ghost to cursor
        _getGhost(e, this);
      }
      // cache selsection & add attr for dragging
      this.classList.add(options.draggingClass);
      dragging = this;
      _attr(dragging, 'aria-grabbed', 'true');
      // grab values
      index = _index(dragging);
      draggingHeight = parseInt(window.getComputedStyle(dragging).height);
      startParent = this.parentElement;
      // dispatch sortstart event on each element in group
      _dispatchEventOnConnected(sortableElement, _makeEvent('sortstart', {
        item: dragging,
        placeholder: placeholder,
        startparent: startParent
      }));
    });
    // Handle drag events on draggable items
    _on(items, 'dragend', function() {
      var newParent;
      if (!dragging) {
        return;
      }
      // remove dragging attributes and show item
      dragging.classList.remove(options.draggingClass);
      _attr(dragging, 'aria-grabbed', 'false');
      dragging.style.display = dragging.oldDisplay;
      delete dragging.oldDisplay;

      placeholders.forEach(_detach);
      newParent = this.parentElement;
      _dispatchEventOnConnected(sortableElement, _makeEvent('sortstop', {
        item: dragging,
        startparent: startParent
      }));
      if (index !== _index(dragging) || startParent !== newParent) {
        _dispatchEventOnConnected(sortableElement, _makeEvent('sortupdate', {
          item: dragging,
          index: _filter(newParent.children, _data(newParent, 'items'))
            .indexOf(dragging),
          oldindex: items.indexOf(dragging),
          elementIndex: _index(dragging),
          oldElementIndex: index,
          startparent: startParent,
          endparent: newParent
        }));
      }
      dragging = null;
      draggingHeight = null;
    });
    // Handle drop event on sortable & placeholder
    // TODO: REMOVE placeholder?????
    _on([sortableElement, placeholder], 'drop', function(e) {
      var visiblePlaceholder;
      if (!_listsConnected(sortableElement, dragging.parentElement)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      visiblePlaceholder = placeholders.filter(_attached)[0];
      _after(visiblePlaceholder, dragging);
      dragging.dispatchEvent(_makeEvent('dragend'));
    });

    // Handle dragover and dragenter events on draggable items
    var onDragOverEnter = function(e) {
      if (!_listsConnected(sortableElement, dragging.parentElement)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (items.indexOf(this) !== -1) {
        var thisHeight = parseInt(window.getComputedStyle(this).height);
        var placeholderIndex = _index(placeholder);
        var thisIndex = _index(this);
        if (options.forcePlaceholderSize) {
          placeholder.style.height = draggingHeight + 'px';
        }

        // Check if `this` is bigger than the draggable. If it is, we have to define a dead zone to prevent flickering
        if (thisHeight > draggingHeight) {
          // Dead zone?
          var deadZone = thisHeight - draggingHeight;
          var offsetTop = _offset(this).top;
          if (placeholderIndex < thisIndex &&
              e.pageY < offsetTop + deadZone) {
            return;
          }
          if (placeholderIndex > thisIndex &&
              e.pageY > offsetTop + thisHeight - deadZone) {
            return;
          }
        }

        if (dragging.oldDisplay === undefined) {
          dragging.oldDisplay = dragging.style.display;
        }
        dragging.style.display = 'none';
        if (placeholderIndex < thisIndex) {
          _after(this, placeholder);
        } else {
          _before(this, placeholder);
        }
        // Intentionally violated chaining, it is more complex otherwise
        placeholders
          .filter(function(element) {return element !== placeholder;})
          .forEach(_detach);
      } else {
        if (placeholders.indexOf(this) === -1 &&
            !_filter(this.children, options.items).length) {
          placeholders.forEach(_detach);
          this.appendChild(placeholder);
        }
      }
    };
    _on(items.concat(sortableElement), 'dragover', onDragOverEnter);
    _on(items.concat(sortableElement), 'dragenter', onDragOverEnter);
  });

  return sortableElements;
};

sortable.destroy = function(sortableElement) {
  _destroySortable(sortableElement);
};

sortable.enable = function(sortableElement) {
  _enableSortable(sortableElement);
};

sortable.disable = function(sortableElement) {
  _disableSortable(sortableElement);
};


return sortable;
}));
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var SortListComponent =

  /**
   * Creates a sortable list using hmtl5sortable function.
   *
   * @param {String} sortListSelector The list selector that has to be sortable.
   * @param {Object} options An object containing the same options as html5sortable. It also includes
   *                an extra option `onSortUpdate`, a callback which returns the children collection
   *                whenever the list order has been changed.
   *
   * @returns {void} Nothing.
   */
  function SortListComponent(sortListSelector, options) {
    _classCallCheck(this, SortListComponent);

    if ($(sortListSelector).length > 0) {
      exports.sortable(sortListSelector, options)[0].addEventListener("sortupdate", function (event) {
        var $children = $(event.target).children();

        if (options.onSortUpdate) {
          options.onSortUpdate($children);
        }
      });
    }
  };

  exports.DecidimAdmin = exports.DecidimAdmin || {};
  exports.DecidimAdmin.SortListComponent = SortListComponent;
  exports.DecidimAdmin.createSortList = function (sortListSelector, options) {
    return new SortListComponent(sortListSelector, options);
  };
})(window);
"use strict";

(function (exports) {
  var _exports$DecidimAdmin = exports.DecidimAdmin;
  var AutoLabelByPositionComponent = _exports$DecidimAdmin.AutoLabelByPositionComponent;
  var AutoButtonsByPositionComponent = _exports$DecidimAdmin.AutoButtonsByPositionComponent;
  var createDynamicFields = _exports$DecidimAdmin.createDynamicFields;
  var createSortList = _exports$DecidimAdmin.createSortList;

  var initMultifield = function initMultifield($wrapper) {
    var wrapperSelector = "#" + $wrapper.attr("id");
    var placeholderId = $wrapper.data("placeholder-id");

    var fieldSelector = ".multifield-field";

    var autoLabelByPosition = new AutoLabelByPositionComponent({
      listSelector: wrapperSelector + " .multifield-field:not(.hidden)",
      labelSelector: ".card-title span:first",
      onPositionComputed: function onPositionComputed(el, idx) {
        $(el).find("input.position-input").val(idx);
      }
    });

    var autoButtonsByPosition = new AutoButtonsByPositionComponent({
      listSelector: wrapperSelector + " .multifield-field:not(.hidden)",
      hideOnFirstSelector: ".move-up-field",
      hideOnLastSelector: ".move-down-field"
    });

    var createSortableList = function createSortableList() {
      createSortList(wrapperSelector + " .fields-list:not(.published)", {
        handle: ".multifield-field-divider",
        placeholder: '<div style="border-style: dashed; border-color: #000"></div>',
        forcePlaceholderSize: true,
        onSortUpdate: function onSortUpdate() {
          autoLabelByPosition.run();
        }
      });
    };

    var hideDeletedSection = function hideDeletedSection($target) {
      var inputDeleted = $target.find("input[name$=\\[deleted\\]]").val();

      if (inputDeleted === "true") {
        $target.addClass("hidden");
        $target.hide();
      }
    };

    createDynamicFields({
      placeholderId: placeholderId,
      wrapperSelector: wrapperSelector,
      containerSelector: ".multifield-fields-list",
      fieldSelector: fieldSelector,
      addFieldButtonSelector: ".add-field",
      removeFieldButtonSelector: ".remove-field",
      moveUpFieldButtonSelector: ".move-up-field",
      moveDownFieldButtonSelector: ".move-down-field",
      onAddField: function onAddField($newField) {
        createSortableList();

        autoLabelByPosition.run();
        autoButtonsByPosition.run();

        $wrapper.trigger("add-field-section", $newField);
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

      hideDeletedSection($target);
    });

    autoLabelByPosition.run();
    autoButtonsByPosition.run();
  };

  $.fn.multifield = function () {
    $(this).each(

    /**
     * @this HTMLElement
     * @return {void}
     */
    function () {
      var $elem = $(this);
      var id = $elem.attr("id");
      if (!id || id.length < 1) {
        id = "multifield-" + Math.random().toString(16).slice(2);
        $elem.attr("id", id);
      }
      initMultifield($elem);
    });
  };
})(window);
"use strict";
"use strict";

(function () {
  var initConstraintFields = function initConstraintFields($section) {
    var $select = $("select.constraint-subject-selector", $section);
    var $modelSelect = $("select.constraint-subject-model-selector", $section);

    $select.on("change init",

    /* @this HTMLElement */
    function () {
      var val = $(this).val();
      $("[data-manifest]", $section).hide();
      $("[data-manifest=\"" + val + "\"]", $section).show();
    }).trigger("init");

    $modelSelect.on("change init",

    /* @this HTMLElement */
    function () {
      var $container = $(this).parents(".manifest-container");
      var val = $(this).val();
      $("[data-components]", $container).hide();
      $("[data-components=\"" + val + "\"]", $container).show();
    }).trigger("init");
  };

  $.fn.constraintSection = function () {
    $(this).each(

    /**
     * @this HTMLElement
     * @return {void}
     */
    function () {
      var $section = $(this);
      initConstraintFields($section);
    });
  };
})();
"use strict";

$(function () {
  var $fields = $("form.translation-sets-form .multifield-fields");

  $fields.multifield();
  $fields.on("add-field-section",

  /* @this HTMLElement */
  function (ev, newField) {
    $(newField).constraintSection();
  });

  $(".constraints-list .constraint-section", $fields).each(function (_i, el) {
    $(el).constraintSection();
  });
});
