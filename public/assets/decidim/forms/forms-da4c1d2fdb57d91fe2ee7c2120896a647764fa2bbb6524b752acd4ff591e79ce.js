"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var OptionAttachedInputsComponent = (function () {
    function OptionAttachedInputsComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, OptionAttachedInputsComponent);

      this.wrapperField = options.wrapperField;
      this.controllerFieldSelector = options.controllerFieldSelector;
      this.dependentInputSelector = options.dependentInputSelector;
      this.controllerSelector = this.wrapperField.find(this.controllerFieldSelector);
      this._bindEvent();
      this._run();
    }

    _createClass(OptionAttachedInputsComponent, [{
      key: "_run",
      value: function _run() {
        var _this = this;

        this.controllerSelector.each(function (idx, el) {
          var $field = $(el);
          var enabled = $field.is(":checked");

          $field.parents("div.collection-input").find(_this.dependentInputSelector).prop("disabled", !enabled);
        });
      }
    }, {
      key: "_bindEvent",
      value: function _bindEvent() {
        var _this2 = this;

        this.controllerSelector.on("change", function () {
          _this2._run();
        });
      }
    }]);

    return OptionAttachedInputsComponent;
  })();

  exports.Decidim = exports.Decidim || {};
  exports.Decidim.createOptionAttachedInputs = function (options) {
    return new OptionAttachedInputsComponent(options);
  };
})(window);
/* eslint-disable no-ternary */

"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var AutosortableCheckboxesComponent = (function () {
    function AutosortableCheckboxesComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, AutosortableCheckboxesComponent);

      this.wrapperField = options.wrapperField;
      this._bindEvent();
      this._order();
      this._normalize();
    }

    // Order by position

    _createClass(AutosortableCheckboxesComponent, [{
      key: "_order",
      value: function _order() {
        var max = $(this.wrapperField).find(".collection-input").length;
        $(this.wrapperField).find(".collection-input").each(function (idx, el) {
          var $positionField = $(el).find("input[name$=\\[position\\]]");
          var position = $positionField.val() ? parseInt($positionField.val(), 10) : max;

          var $next = $(el).next();
          while ($next.length > 0) {
            var $nextPositionField = $next.find("input[name$=\\[position\\]]");
            var nextPosition = $nextPositionField.val() ? parseInt($nextPositionField.val(), 10) : max;

            if (position > nextPosition) {
              $next.insertBefore($(el));
            }
            $next = $next.next();
          }
        });
      }
    }, {
      key: "_findLastPosition",
      value: function _findLastPosition() {
        var lastPosition = 0;
        $(this.wrapperField).find(".collection-input").each(function (idx, el) {
          var $positionField = $(el).find("input[name$=\\[position\\]]");
          var position = parseInt($positionField.val(), 10);
          if (position > lastPosition) {
            lastPosition = position;
          }
        });
        return lastPosition;
      }
    }, {
      key: "_normalize",
      value: function _normalize() {
        $(this.wrapperField).find(".collection-input .position").each(function (idx, el) {
          var $positionField = $(el).parent().find("input[name$=\\[position\\]]");
          if ($positionField.val()) {
            $positionField.val(idx);
            $positionField.prop("disabled", false);
            $(el).html(idx + 1 + ". ");
          }
        });
      }
    }, {
      key: "_bindEvent",
      value: function _bindEvent() {
        var _this = this;

        $(this.wrapperField).find("input[type=checkbox]").on("change", function (el) {
          var $parentLabel = $(el.target).parents("label");
          var $positionSelector = $parentLabel.find(".position");
          var $positionField = $parentLabel.find("input[name$=\\[position\\]]");
          var lastPosition = _this._findLastPosition();

          if (el.target.checked) {
            $positionField.val(lastPosition + 1);
            $positionField.prop("disabled", false);
            $positionSelector.html(lastPosition + 1);
          } else {
            $positionField.val("");
            $positionField.prop("disabled", true);
            $positionSelector.html("");
          }
          _this._order();
          _this._normalize();
        });
      }
    }]);

    return AutosortableCheckboxesComponent;
  })();

  exports.Decidim = exports.Decidim || {};
  exports.Decidim.createAutosortableCheckboxes = function (options) {
    return new AutosortableCheckboxesComponent(options);
  };
})(window);
/* eslint-disable no-ternary, no-plusplus */

"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var DisplayCondition = (function () {
    function DisplayCondition() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, DisplayCondition);

      this.wrapperField = options.wrapperField;
      this.type = options.type;
      this.conditionQuestion = options.conditionQuestion;
      this.answerOption = options.answerOption;
      this.mandatory = options.mandatory;
      this.value = options.value;
      this.onFulfilled = options.onFulfilled;
      this.bindEvent();
    }

    _createClass(DisplayCondition, [{
      key: "bindEvent",
      value: function bindEvent() {
        this.checkCondition();
        this.getInputsToListen().on("change", this.checkCondition.bind(this));
      }
    }, {
      key: "getInputValue",
      value: function getInputValue() {
        var $conditionWrapperField = $(".question[data-question-id='" + this.conditionQuestion + "']");
        var $textInput = $conditionWrapperField.find("textarea, input[type='text']:not([name$=\\[custom_body\\]])");

        if ($textInput.length) {
          return $textInput.val();
        }

        var multipleInput = [];

        $conditionWrapperField.find(".radio-button-collection, .check-box-collection").find(".collection-input").each(function (idx, el) {
          var $input = $(el).find("input[name$=\\[body\\]]");
          var checked = $input.is(":checked");

          if (checked) {
            var text = $(el).find("input[name$=\\[custom_body\\]]").val();
            var value = $input.val();
            var id = $(el).find("input[name$=\\[answer_option_id\\]]").val();

            multipleInput.push({ id: id, value: value, text: text });
          }
        });

        return multipleInput;
      }
    }, {
      key: "getInputsToListen",
      value: function getInputsToListen() {
        var $conditionWrapperField = $(".question[data-question-id='" + this.conditionQuestion + "']");
        var $textInput = $conditionWrapperField.find("textarea, input[type='text']:not([name$=\\[custom_body\\]])");

        if ($textInput.length) {
          return $textInput;
        }

        return $conditionWrapperField.find(".collection-input").find("input:not([type='hidden'])");
      }
    }, {
      key: "checkAnsweredCondition",
      value: function checkAnsweredCondition(value) {
        if (typeof value !== "object") {
          return Boolean(value);
        }

        return Boolean(value.some(function (it) {
          return it.value;
        }));
      }
    }, {
      key: "checkNotAnsweredCondition",
      value: function checkNotAnsweredCondition(value) {
        return !this.checkAnsweredCondition(value);
      }
    }, {
      key: "checkEqualCondition",
      value: function checkEqualCondition(value) {
        var _this = this;

        if (value.length) {
          return value.some(function (it) {
            return it.id === _this.answerOption.toString();
          });
        }
        return false;
      }
    }, {
      key: "checkNotEqualCondition",
      value: function checkNotEqualCondition(value) {
        var _this2 = this;

        if (value.length) {
          return value.every(function (it) {
            return it.id !== _this2.answerOption.toString();
          });
        }
        return false;
      }
    }, {
      key: "checkMatchCondition",
      value: function checkMatchCondition(value) {
        var regexp = new RegExp(this.value, "i");

        if (typeof value !== "object") {
          return Boolean(value.match(regexp));
        }

        return value.some(function (it) {
          return it.text ? it.text.match(regexp) : it.value.match(regexp);
        });
      }
    }, {
      key: "checkCondition",
      value: function checkCondition() {
        var value = this.getInputValue();
        var fulfilled = false;

        switch (this.type) {
          case "answered":
            fulfilled = this.checkAnsweredCondition(value);
            break;
          case "not_answered":
            fulfilled = this.checkNotAnsweredCondition(value);
            break;
          case "equal":
            fulfilled = this.checkEqualCondition(value);
            break;
          case "not_equal":
            fulfilled = this.checkNotEqualCondition(value);
            break;
          case "match":
            fulfilled = this.checkMatchCondition(value);
            break;
          default:
            fulfilled = false;
            break;
        }

        this.onFulfilled(fulfilled);
      }
    }]);

    return DisplayCondition;
  })();

  var DisplayConditionsComponent = (function () {
    function DisplayConditionsComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, DisplayConditionsComponent);

      this.wrapperField = options.wrapperField;
      this.conditions = {};
      this.showCount = 0;
      this.initializeConditions();
    }

    _createClass(DisplayConditionsComponent, [{
      key: "initializeConditions",
      value: function initializeConditions() {
        var _this3 = this;

        var $conditionElements = this.wrapperField.find(".display-condition");

        $conditionElements.each(function (idx, el) {
          var $condition = $(el);
          var id = $condition.data("id");
          _this3.conditions[id] = {};

          _this3.conditions[id] = new DisplayCondition({
            wrapperField: _this3.wrapperField,
            type: $condition.data("type"),
            conditionQuestion: $condition.data("condition"),
            answerOption: $condition.data("option"),
            mandatory: $condition.data("mandatory"),
            value: $condition.data("value"),
            onFulfilled: function onFulfilled(fulfilled) {
              _this3.onFulfilled(id, fulfilled);
            }
          });
        });
      }
    }, {
      key: "mustShow",
      value: function mustShow() {
        var conditions = Object.values(this.conditions);
        var mandatoryConditions = conditions.filter(function (condition) {
          return condition.mandatory;
        });
        var nonMandatoryConditions = conditions.filter(function (condition) {
          return !condition.mandatory;
        });

        if (mandatoryConditions.length) {
          return mandatoryConditions.every(function (condition) {
            return condition.fulfilled;
          });
        }

        return nonMandatoryConditions.some(function (condition) {
          return condition.fulfilled;
        });
      }
    }, {
      key: "onFulfilled",
      value: function onFulfilled(id, fulfilled) {
        this.conditions[id].fulfilled = fulfilled;

        if (this.mustShow()) {
          this.showQuestion();
        } else {
          this.hideQuestion();
        }
      }
    }, {
      key: "showQuestion",
      value: function showQuestion() {
        this.wrapperField.fadeIn();
        this.wrapperField.find("input, textarea").prop("disabled", null);
        this.showCount++;
      }
    }, {
      key: "hideQuestion",
      value: function hideQuestion() {
        if (this.showCount) {
          this.wrapperField.fadeOut();
        } else {
          this.wrapperField.hide();
        }

        this.wrapperField.find("input, textarea").prop("disabled", "disabled");
      }
    }]);

    return DisplayConditionsComponent;
  })();

  exports.Decidim = exports.Decidim || {};
  exports.Decidim.createDisplayConditions = function (options) {
    return new DisplayConditionsComponent(options);
  };
})(window);
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var MaxChoicesAlertComponent = (function () {
    function MaxChoicesAlertComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, MaxChoicesAlertComponent);

      this.wrapperField = options.wrapperField;
      this.alertElement = options.alertElement;
      this.controllerFieldSelector = options.controllerFieldSelector;
      this.controllerCollectionSelector = options.controllerCollectionSelector;
      this.maxChoices = options.maxChoices;
      this.controllerSelector = this.wrapperField.find(this.controllerFieldSelector);
      this._bindEvent();
      this._run();
    }

    _createClass(MaxChoicesAlertComponent, [{
      key: "_run",
      value: function _run() {
        var _this = this;

        var rows = this.wrapperField.find(this.controllerCollectionSelector);

        var alert = false;

        rows.each(function (rowIdx, row) {
          var checked = $(row).find(_this.controllerFieldSelector).filter(function (checkboxIdx, checkbox) {
            return $(checkbox).is(":checked");
          });

          alert = alert || checked.length > _this.maxChoices;
        });

        if (alert) {
          this.alertElement.show();
        } else {
          this.alertElement.hide();
        }
      }
    }, {
      key: "_bindEvent",
      value: function _bindEvent() {
        var _this2 = this;

        this.controllerSelector.on("change", function () {
          _this2._run();
        });
      }
    }]);

    return MaxChoicesAlertComponent;
  })();

  exports.Decidim = exports.Decidim || {};
  exports.Decidim.createMaxChoicesAlertComponent = function (options) {
    return new MaxChoicesAlertComponent(options);
  };
})(window);
"use strict";

(function (exports) {
  var _exports$Decidim = exports.Decidim;
  var createOptionAttachedInputs = _exports$Decidim.createOptionAttachedInputs;
  var createAutosortableCheckboxes = _exports$Decidim.createAutosortableCheckboxes;
  var createMaxChoicesAlertComponent = _exports$Decidim.createMaxChoicesAlertComponent;
  var createDisplayConditions = _exports$Decidim.createDisplayConditions;

  $(".radio-button-collection, .check-box-collection").each(function (idx, el) {
    createOptionAttachedInputs({
      wrapperField: $(el),
      controllerFieldSelector: "input[type=radio], input[type=checkbox]",
      dependentInputSelector: "input[type=text], input[type=hidden]"
    });
  });

  $.unique($(".check-box-collection").parents(".answer")).each(function (idx, el) {
    var maxChoices = $(el).data("max-choices");
    if (maxChoices) {
      createMaxChoicesAlertComponent({
        wrapperField: $(el),
        controllerFieldSelector: "input[type=checkbox]",
        controllerCollectionSelector: ".check-box-collection",
        alertElement: $(el).find(".max-choices-alert"),
        maxChoices: maxChoices
      });
    }
  });

  $(".sortable-check-box-collection").each(function (idx, el) {
    createAutosortableCheckboxes({
      wrapperField: $(el)
    });
  });

  $(".answer-questionnaire .question[data-conditioned='true']").each(function (idx, el) {
    createDisplayConditions({
      wrapperField: $(el)
    });
  });

  var $form = $("form.answer-questionnaire");
  if ($form.length > 0) {
    (function () {
      $form.find("input, textarea, select").on("change", function () {
        $form.data("changed", true);
      });

      var safePath = $form.data("safe-path").split("?")[0];
      $(document).on("click", "a", function (event) {
        window.exitUrl = event.currentTarget.href;
      });
      $(document).on("submit", "form", function (event) {
        window.exitUrl = event.currentTarget.action;
      });

      window.onbeforeunload = function () {
        var exitUrl = window.exitUrl;
        var hasChanged = $form.data("changed");
        window.exitUrl = null;

        if (!hasChanged || exitUrl && exitUrl.includes(safePath)) {
          return null;
        }

        return "";
      };
    })();
  }
})(window);
