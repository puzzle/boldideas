"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var SubformMultiTogglerComponent = (function () {
    function SubformMultiTogglerComponent() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, SubformMultiTogglerComponent);

      this.controllerSelect = options.controllerSelect;
      this.subformWrapperClass = options.subformWrapperClass;
      this.globalWrapperSelector = options.globalWrapperSelector;
      this._bindEvent();
      this._runAll();
    }

    _createClass(SubformMultiTogglerComponent, [{
      key: "_runAll",
      value: function _runAll() {
        var _this = this;

        this.controllerSelect.each(function (idx, el) {
          _this.run(el);
        });
      }
    }, {
      key: "run",
      value: function run(target) {
        var $target = $(target);
        var subformWrapperClass = this.subformWrapperClass;
        var value = $target.val();

        var $form = $target.parents(this.globalWrapperSelector);
        var $selectedSubform = $form.find("#" + subformWrapperClass + "-" + value);

        if ($target.prop("checked")) {
          $selectedSubform.find("input,textarea").prop("disabled", false);
          $selectedSubform.show();
        } else {
          $selectedSubform.find("input,textarea").prop("disabled", true);
          $selectedSubform.hide();
        }
      }
    }, {
      key: "_bindEvent",
      value: function _bindEvent() {
        var _this2 = this;

        this.controllerSelect.on("change", function (event) {
          _this2.run(event.target);
        });
      }
    }]);

    return SubformMultiTogglerComponent;
  })();

  exports.DecidimAdmin = exports.DecidimAdmin || {};
  exports.DecidimAdmin.SubformMultiTogglerComponent = SubformMultiTogglerComponent;
})(window);
"use strict";

(function (exports) {
  var SubformMultiTogglerComponent = exports.DecidimAdmin.SubformMultiTogglerComponent;

  var subformMultiToggler = new SubformMultiTogglerComponent({
    controllerSelect: $("input[name$=\\[authorization_handlers\\]\\[\\]]"),
    subformWrapperClass: "authorization-handler",
    globalWrapperSelector: "fieldset"
  });

  subformMultiToggler.run();
})(window);
