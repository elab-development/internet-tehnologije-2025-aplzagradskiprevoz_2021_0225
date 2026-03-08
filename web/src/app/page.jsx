'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import PretragaStanica from '../components/PretragaStanica';
import DetaljiLinije from '../components/DetaljiLinije';
import AuthPanel from '../components/AuthPanel';
import { dohvatiTrasuLinije } from '../lib/api';

const Mapa = dynamic(() => import('../components/Mapa'), { ssr: false });

export default function HomePage() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [lines, setLines] = useState([]);
  const [lineShape, setLineShape] = useState(null);
  const [lineStations, setLineStations] = useState([]);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const sacuvanAuth = localStorage.getItem('authData');
    if (!sacuvanAuth) return;
    try {
      setAuth(JSON.parse(sacuvanAuth));
    } catch (err) {
      localStorage.removeItem('authData');
    }
  }, []);

  function normalizeShape(shape) {
    if (!shape) return null;
    if (shape.type !== 'LineString') return shape;
    if (!Array.isArray(shape.coordinates) || shape.coordinates.length < 2) return null;
    return shape;
  }

  async function handleStationSelected(data) {
    setSelectedStation(data.station);
    setStations([data.station]);
    setLines(data.lines || []);
    if (data.lines && data.lines.length > 0) {
      const firstLine = data.lines[0];
      const lineData = await dohvatiTrasuLinije(firstLine.id, data.station.id);
      setLineShape(normalizeShape(lineData.shape));
      setLineStations(lineData.stations || []);
    } else {
      setLineShape(null);
      setLineStations([]);
    }
  }

  function handleLineSelected(data) {
    setLineShape(normalizeShape(data.shape));
    setLineStations(data.stations || []);
  }

  function handleClearSelection() {
    setSelectedStation(null);
    setStations([]);
    setLines([]);
    setLineShape(null);
    setLineStations([]);
  }

  function handleAuthChange(data) {
    setAuth(data);
    localStorage.setItem('authData', JSON.stringify(data));
  }

  function handleLogout() {
    setAuth(null);
    localStorage.removeItem('authData');
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="relative z-[1200] mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-ink">Bus Minus</h1>
          </div>
          <AuthPanel auth={auth} onAuthChange={handleAuthChange} onLogout={handleLogout} />
        </header>

        <div className="grid lg:grid-cols-[360px_1fr] gap-8">
          <aside className="space-y-6">
            <PretragaStanica
              onStationSelected={handleStationSelected}
              selectedStation={selectedStation}
              onClearSelection={handleClearSelection}
              auth={auth}
            />

            {selectedStation ? (
              <DetaljiLinije
                lines={lines}
                onLineSelected={handleLineSelected}
                selectedStationId={selectedStation?.id}
                auth={auth}
              />
            ) : null}
          </aside>

          <section className="rounded-3xl bg-white/70 p-4 border border-rose/20 shadow-sm">
            <Mapa
              stations={stations}
              selectedStationId={selectedStation?.id}
              selectedStation={selectedStation}
              lineShape={lineShape}
              lineStations={lineStations}
            />
            {lineStations.length > 0 ? (
              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-600">Redosled stanica</div>
                <ol className="mt-2 list-decimal list-inside text-sm text-slate-600">
                  {lineStations.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
