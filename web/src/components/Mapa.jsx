'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

const defaultCenter = [44.8125, 20.4612];

function setupDefaultIcon() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  });
}

export default function Mapa({ stations, selectedStationId, selectedStation, lineShape, lineStations }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const lineRef = useRef(null);

  useEffect(() => {
    setupDefaultIcon();
    if (mapRef.current) return;

    mapRef.current = L.map('map', {
      center: defaultCenter,
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((s) => {
      const marker = L.marker([s.lat, s.lon]);
      if (s.id === selectedStationId) {
        marker.bindPopup(`<b>${s.name}</b>`).openPopup();
      } else {
        marker.bindPopup(`<b>${s.name}</b>`);
      }
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [stations, selectedStationId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStation) return;
    map.setView([selectedStation.lat, selectedStation.lon], 15, { animate: true });
  }, [selectedStation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }

    if (lineShape) {
      lineRef.current = L.geoJSON(lineShape, {
        style: { color: '#f43f5e', weight: 4 }
      }).addTo(map);

      const bounds = lineRef.current.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } else if (lineStations.length > 0) {
      const latlngs = lineStations.map((s) => [s.lat, s.lon]);
      lineRef.current = L.polyline(latlngs, { color: '#f43f5e', weight: 4 }).addTo(map);
      map.fitBounds(lineRef.current.getBounds(), { padding: [24, 24] });
    }
  }, [lineShape, lineStations]);

  return <div id="map" className="map-container" />;
}
