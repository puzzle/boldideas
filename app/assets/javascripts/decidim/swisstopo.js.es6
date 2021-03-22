// = require leaflet
// = require leaflet-tilelayer-swiss
// = require leaflet-svg-icon
// = require leaflet.markercluster
// = require jquery-tmpl
// = require_self
// = require decidim/map

/**
 * NOTE:
 * This has to load before decidim/map in order for it to apply correctly when
 * the map is initialized. The document.ready handler set by this script has to
 * be registered before decidim/map registers its own.
 *
 * Also it has to load after JQuery.
 */
((exports) => {
  const $ = exports.$; // eslint-disable-line
  const L = exports.L; // eslint-disable-line

  $(() => {
    exports.Decidim = exports.Decidim || {};
    const MapMarkersController = exports.Decidim.MapMarkersController;
    const MapStaticController = exports.Decidim.MapStaticController;

    class SwisstopoMapController extends MapMarkersController {
      start() {
        this.setCoordinateReferenceSystem()
        this.addTileLayers()

        // decidim adds the markers for us
        super.start()

        this.setViewport()
      }

      setCoordinateReferenceSystem() {
        // Swiss coordinate system LV95 is used in these maps, see https://epsg.io/2056
        this.map.options.crs = L.CRS.EPSG2056;
      }

      addTileLayers() {
        L.tileLayer.swiss().addTo(this.map);
      }

      setViewport() {
        if (this.config.markers.length === 0) {
          const center = this.config.defaultCenter ? [this.config.defaultCenter.lat, this.config.defaultCenter.lng] : [0, 0];
          const bounds = new L.LatLngBounds([center, center]);
          this.map.fitBounds(bounds, { padding: [100, 100], maxZoom: 19 });
        } else {
          const bounds = new L.LatLngBounds(this.config.markers.map((markerData) => [markerData.latitude, markerData.longitude]));
          this.map.fitBounds(bounds, { padding: [100, 100], maxZoom: 23 });
        }
      }
    }

    // We need to replace the dynamic map controller of decidim and use our own
    exports.Decidim.createMapController = (mapId, config) => {
      if (config.type === "static") {
        return new MapStaticController(mapId, config);
      }

      return new SwisstopoMapController(mapId, config);
    }

    $("[data-decidim-map]").on("configure.decidim", (_ev, map, _mapConfig) => {
      $(map._container).css("display", "block");
    })
  });

})(window);
