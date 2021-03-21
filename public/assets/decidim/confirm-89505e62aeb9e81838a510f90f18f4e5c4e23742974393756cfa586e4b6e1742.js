/**
 * A custom confirm dialog for Decidim based on Foundation reveals.
 *
 * Note that this needs to be loaded before the application JS in order for
 * it to gain control over the confirm events BEFORE rails-ujs is loaded.
 */

"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (exports) {
  var document = exports.document;

  var TEMPLATE_HTML = null;

  var ConfirmDialog = (function () {
    function ConfirmDialog(sourceElement) {
      _classCallCheck(this, ConfirmDialog);

      this.$modal = $(TEMPLATE_HTML);
      this.$source = sourceElement;
      this.$content = exports.$(".confirm-modal-content", this.$modal);
      this.$buttonConfirm = exports.$("[data-confirm-ok]", this.$modal);
      this.$buttonCancel = exports.$("[data-confirm-cancel]", this.$modal);

      // Avoid duplicate IDs and append the new modal to the body
      var titleId = "confirm-modal-title-" + Math.random().toString(36).substring(7);

      this.$modal.removeAttr("id");
      $("#confirm-modal-title", this.$modal).attr("id", titleId);
      this.$modal.attr("aria-labelledby", titleId);

      $("body").append(this.$modal);
      this.$modal.foundation();
    }

    _createClass(ConfirmDialog, [{
      key: "confirm",
      value: function confirm(message) {
        var _this = this;

        this.$content.html(message);

        this.$buttonConfirm.off("click");
        this.$buttonCancel.off("click");

        return new Promise(function (resolve) {
          _this.$buttonConfirm.on("click", function (ev) {
            ev.preventDefault();

            _this.$modal.foundation("close");
            resolve(true);
            _this.$source.focus();
          });
          _this.$buttonCancel.on("click", function (ev) {
            ev.preventDefault();

            _this.$modal.foundation("close");
            resolve(false);
            _this.$source.focus();
          });

          _this.$modal.foundation("open").on("closed.zf.reveal", function () {
            _this.$modal.remove();
          });
        });
      }
    }]);

    return ConfirmDialog;
  })();

  exports.Decidim = exports.Decidim || {};
  exports.Decidim.ConfirmDialog = ConfirmDialog;

  // Override the default confirm dialog by Rails
  // See:
  // https://github.com/rails/rails/blob/fba1064153d8e2f4654df7762a7d3664b93e9fc8/actionview/app/assets/javascripts/rails-ujs/features/confirm.coffee
  //
  // There is apparently a better way coming in Rails 6:
  // https://github.com/rails/rails/commit/e9aa7ecdee0aa7bb4dcfa5046881bde2f1fe21cc#diff-e1aaa45200e9adcbcb8baf1c5375b5d1

  // Attach bindings BEFORE Rails adds its own bindings.
  document.addEventListener("rails:attachBindings", function () {
    var Rails = exports.Rails;
    var fire = Rails.fire;
    var matches = Rails.matches;
    var stopEverything = Rails.stopEverything;

    var allowAction = function allowAction(ev, element) {
      var message = exports.$(element).data("confirm");
      if (!message) {
        return true;
      }

      if (!fire(element, "confirm")) {
        return false;
      }

      if (TEMPLATE_HTML === null) {
        TEMPLATE_HTML = exports.$("#confirm-modal")[0].outerHTML;
        exports.$("#confirm-modal").remove();
      }

      var dialog = new ConfirmDialog(exports.$(element));
      dialog.confirm(message).then(function (answer) {
        var completed = fire(element, "confirm:complete", [answer]);
        if (answer && completed) {
          // Allow the event to propagate normally and re-dispatch it without
          // the confirm data attribute which the Rails internal method is
          // checking.
          exports.$(element).data("confirm", null);
          exports.$(element).removeAttr("data-confirm");

          // The submit button click events won't do anything if they are
          // dispatched as is. In these cases, just submit the underlying form.
          if (ev.type === "click" && (exports.$(element).is('button[type="submit"]') || exports.$(element).is('input[type="submit"]'))) {
            exports.$(element).parents("form").submit();
          } else {
            var origEv = ev.originalEvent || ev;
            var newEv = origEv;
            if (typeof Event === "function") {
              // Clone the event because otherwise some click events may not
              // work properly when re-dispatched.
              newEv = new origEv.constructor(origEv.type, origEv);
            }
            ev.target.dispatchEvent(newEv);
          }
        }
      });

      return false;
    };
    var handleConfirm = function handleConfirm(ev, element) {
      if (!allowAction(ev, element)) {
        stopEverything(ev);
      }
    };
    var getMatchingEventTarget = function getMatchingEventTarget(ev, selector) {
      var target = ev.target;
      while (!(!(target instanceof Element) || matches(target, selector))) {
        target = target.parentNode;
      }

      if (target instanceof Element) {
        return target;
      }

      return null;
    };
    var handleDocumentEvent = function handleDocumentEvent(ev, matchSelectors) {
      return matchSelectors.some(function (currentSelector) {
        var target = getMatchingEventTarget(ev, currentSelector);
        if (target === null) {
          return false;
        }

        handleConfirm(ev, target);
        return true;
      });
    };

    document.addEventListener("click", function (ev) {
      return handleDocumentEvent(ev, [Rails.linkClickSelector, Rails.buttonClickSelector, Rails.formInputClickSelector]);
    });
    document.addEventListener("change", function (ev) {
      return handleDocumentEvent(ev, [Rails.inputChangeSelector]);
    });
    document.addEventListener("submit", function (ev) {
      return handleDocumentEvent(ev, [Rails.formSubmitSelector]);
    });

    // This is needed for the confirm dialog to work with Foundation Abide.
    // Abide registers its own submit click listeners since Foundation 5.6.x
    // which will be handled before the document listeners above. This would
    // break the custom confirm functionality when used with Foundation Abide.
    document.addEventListener("DOMContentLoaded", function () {
      exports.$(Rails.formInputClickSelector).on("click.confirm", function (ev) {
        handleConfirm(ev, getMatchingEventTarget(ev, Rails.formInputClickSelector));
      });
    });
  });
})(window);
