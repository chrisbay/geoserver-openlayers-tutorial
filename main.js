import 'ol';
import 'ol/ol.css';
import Overlay from 'ol/overlay';
import {apply} from 'ol-mapbox-style';
import WFS from 'ol/format/wfs';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import VectorSource from 'ol/source/vector';
import coordinate from 'ol/coordinate';
import Fill from 'ol/style/fill';
import Style from 'ol/style/style';
import Stroke from 'ol/style/stroke';

const map = apply('map-container', './data/osm-basemap.json');

let parksSource = new VectorSource();
let parksLayer = new VectorLayer({
  source: parksSource,
  style: new Style({
    fill: new Fill({
      color: 'rgb(0,192,0,0.3)'
    }),
    stroke: new Stroke({
      color: 'rgb(0,192,0)',
      width: 1
    })
  })
});

parksLayer.setZIndex(50);
map.addLayer(parksLayer);

let featureRequest = new WFS().writeGetFeature({
  srsName: 'EPSG:3857',
  featureNS: 'http://launchcode.org',
  featurePrefix: 'lc',
  featureTypes: ['parks'],
  outputFormat: 'application/json'
});

fetch('http://localhost:8080/geoserver/wfs', {
  method: 'POST',
  body: new XMLSerializer().serializeToString(featureRequest)
}).then(function(response) {
  return response.json();
}).then(function(json) {
  let features = new GeoJSON().readFeatures(json);
  parksSource.addFeatures(features);
});

var overlay = new Overlay({
  element: document.getElementById('popup-container'),
  positioning: 'bottom-center',
  offset: [0, -10]
});
map.addOverlay(overlay);

map.on('click', function(e) {
  overlay.setPosition();
  let features = map.getFeaturesAtPixel(e.pixel);
  if (features) {
    let park = features[0];
    let properties = park.getProperties();
    let parkGeometry = features[0].getGeometry();
    let extent = parkGeometry.getExtent();
    let overlayCoords = parkGeometry.getClosestPoint([extent[0], extent[3]]);
    overlay.getElement().innerHTML = properties['TEXT_'];
    overlay.setPosition(overlayCoords);
  }
});