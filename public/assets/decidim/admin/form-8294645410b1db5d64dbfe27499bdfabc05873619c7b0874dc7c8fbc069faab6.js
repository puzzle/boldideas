"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var BudgetRuleTogglerComponent = (function () {
    function BudgetRuleTogglerComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, BudgetRuleTogglerComponent);

      this.ruleCheckboxes = options.ruleCheckboxes;
      this._runAll();
    }

    _createClass(BudgetRuleTogglerComponent, [{
      key: "_runAll",
      value: function _runAll() {
        var _this = this;

        this.ruleCheckboxes.each(function (_i, checkbox) {
          _this._bindEvent(checkbox);
          _this.run(checkbox);
        });
      }
    }, {
      key: "_bindEvent",
      value: function _bindEvent(target) {
        var _this2 = this;

        $(target).on("change", function (event) {
          _this2.run(event.target);
        });
      }
    }, {
      key: "run",
      value: function run(target) {
        var _this3 = this;

        this.toggleTextInput(target);

        if ($(target).prop("checked")) {
          this.ruleCheckboxes.filter(function (_i, checkbox) {
            return checkbox !== target;
          }).prop("checked", false).each(function (_i, checkbox) {
            _this3.toggleTextInput(checkbox);
          });
        }
      }
    }, {
      key: "toggleTextInput",
      value: function toggleTextInput(target) {
        var input = $(target).closest("div").next();
        if ($(target).prop("checked")) {
          input.slideDown();
        } else {
          input.slideUp();
        }
      }
    }]);

    return BudgetRuleTogglerComponent;
  })();

  exports.DecidimAdmin = exports.DecidimAdmin || {};
  exports.DecidimAdmin.BudgetRuleTogglerComponent = BudgetRuleTogglerComponent;
})(window);
"use strict";

$(function () {
  (function (exports) {
    var $ComponentScopeEnabled = $("#component_settings_scopes_enabled");
    var $ComponentScopeId = $("#component_settings_scope_id");

    if ($(".edit_component, .new_component").length > 0) {
      $ComponentScopeEnabled.on("change", function (event) {
        var checked = event.target.checked;
        exports.theDataPicker.enabled($ComponentScopeId, checked);
      });
      exports.theDataPicker.enabled($ComponentScopeId, $ComponentScopeEnabled.prop("checked"));
    }
  })(window);
});
"use strict";

(function (exports) {
  var BudgetRuleTogglerComponent = exports.DecidimAdmin.BudgetRuleTogglerComponent;

  var budgetRuleToggler = new BudgetRuleTogglerComponent({
    ruleCheckboxes: $("input[id^='component_settings_vote_rule_']")
  });

  budgetRuleToggler.run();
})(window);

// Checks if the form contains fields with special CSS classes added in
// Decidim::Admin::SettingsHelper and acts accordingly.
$(function () {
  // Prevents readonly containers from being modified.
  var $readonlyContainer = $(".readonly_container input");

  $readonlyContainer.click(function (event) {
    event.preventDefault();
    return false;
  });

  // Target fields:
  // - amendments_wizard_help_text
  // - amendments_visibility
  // - amendment_creation_enabled
  // - amendment_reaction_enabled
  // - amendment_promotion_enabled

  // (1) Hides target fields if amendments_enabled component setting is NOT checked.
  // (2) Toggles visibilty of target fields when amendments_enabled component setting is clicked.
  var $amendmentsEnabled = $("input#component_settings_amendments_enabled");

  if ($amendmentsEnabled.length > 0) {
    (function () {
      var $amendmentStepSettings = $(".amendments_wizard_help_text_container, .amendments_visibility_container, .amendment_creation_enabled_container, .amendment_reaction_enabled_container, .amendment_promotion_enabled_container");

      if ($amendmentsEnabled.is(":not(:checked)")) {
        $amendmentStepSettings.hide();
      }

      $amendmentsEnabled.click(function () {
        $amendmentStepSettings.toggle();
      });
    })();
  }
});
