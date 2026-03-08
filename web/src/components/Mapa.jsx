'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

const defaultCenter = [44.8125, 20.4612];
const DEFAULT_PIN = '#3b82f6';
const SELECTED_PIN = '#e11d48';
const BORDER_COLOR = '#be123c';

function createPinIcon(fillColor, borderColor) {
  return L.divIcon({
    className: 'custom-pin-icon',
    iconSize: [26, 36],
    iconAnchor: [13, 36],
    popupAnchor: [0, -32],
    html: `
      <svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13 1C6.7 1 1.5 6.2 1.5 12.5c0 8.2 8.6 17.3 11.5 22.5 2.9-5.2 11.5-14.3 11.5-22.5C24.5 6.2 19.3 1 13 1z" fill="${fillColor}" stroke="${borderColor}" stroke-width="2"/>
        <circle cx="13" cy="12.5" r="4.2" fill="${borderColor}" />
      </svg>
    `
  });
}

const defaultPinIcon = createPinIcon(DEFAULT_PIN, '#1d4ed8');
const selectedPinIcon = createPinIcon(SELECTED_PIN, '#9f1239');

const routeDotIcon = L.divIcon({
  className: 'custom-route-dot',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  popupAnchor: [0, -6],
  html: '<div style="width:10px;height:10px;border-radius:9999px;background:#ffffff;border:2px solid #be123c;"></div>'
});

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

    const rutaAktivna = Array.isArray(lineStations) && lineStations.length > 0;
    const prikazStanica = rutaAktivna ? [...lineStations] : [...stations];

    if (
      rutaAktivna &&
      selectedStation &&
      !prikazStanica.some((s) => Number(s.id) === Number(selectedStation.id))
    ) {
      prikazStanica.push(selectedStation);
    }

    prikazStanica.forEach((s) => {
      const izabrana = Number(s.id) === Number(selectedStationId);
      const icon = izabrana ? selectedPinIcon : rutaAktivna ? routeDotIcon : defaultPinIcon;
      const marker = L.marker([s.lat, s.lon], { icon });
      if (s.id === selectedStationId) {
        marker.bindPopup(`<b>${s.name}</b>`).openPopup();
      } else {
        marker.bindPopup(`<b>${s.name}</b>`);
      }
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [stations, selectedStationId, selectedStation, lineStations]);

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
