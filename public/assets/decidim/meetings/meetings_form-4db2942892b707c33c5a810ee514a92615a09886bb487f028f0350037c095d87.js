"use strict";

(function (exports) {
  var $ = exports.$; // eslint-disable-line
  var attachGeocoding = exports.Decidim.attachGeocoding;

  $(function () {
    // Adds the latitude/longitude inputs after the geocoding is done
    attachGeocoding($("#meeting_address"));
  });
})(window);
