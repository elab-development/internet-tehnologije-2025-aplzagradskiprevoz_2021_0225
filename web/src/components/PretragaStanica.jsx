'use client';

import { useState } from 'react';
import { dohvatiStanice, dohvatiStanicu } from '../lib/api';

export default function PretragaStanica({ onStationSelected, selectedStation, onClearSelection }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setHasSearched(true);
    setLoading(true);
    const data = await dohvatiStanice(query);
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleSelect(stationId) {
    const data = await dohvatiStanicu(stationId);
    onStationSelected(data);
  }

  return (
    <div className="bg-white/80 rounded-3xl p-5 shadow-sm border border-rose/20">
      <div className="text-xs uppercase tracking-[0.3em] text-rose-400">Pretraga</div>
      <form onSubmit={handleSearch} className="mt-3 flex gap-3">
        <input
          className="flex-1 rounded-2xl border border-rose/30 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-rose/40"
          placeholder="Unesi naziv ili kod stanice..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedStation && onClearSelection) {
              onClearSelection();
              setResults([]);
            }
            if (hasSearched) {
              setHasSearched(false);
            }
          }}
        />
        <button
          type="submit"
          className="rounded-2xl bg-rose text-white px-5 py-3 font-semibold hover:bg-crimson transition"
        >
          Pretraži
        </button>
      </form>
      <div className="mt-4 text-sm text-slate-500">{loading ? 'Ucitavanje...' : ''}</div>
      <ul className="mt-3 space-y-2">
        {selectedStation ? (
          <li className="flex items-center justify-between rounded-2xl border border-rose/20 bg-white px-4 py-3">
            <div>
              <div className="font-semibold text-ink">
                {selectedStation.name}{' '}
                {selectedStation.display_code ? (
                  <span className="text-xs text-rose-500">({selectedStation.display_code})</span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500">
                {selectedStation.lat.toFixed(4)}, {selectedStation.lon.toFixed(4)}
              </div>
            </div>
            <button
              onClick={onClearSelection}
              className="text-sm font-semibold text-rose-600"
            >
              Promeni
            </button>
          </li>
        ) : (
          results.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-2xl border border-rose/10 bg-white px-4 py-3 hover:border-rose/30 transition"
            >
              <div>
                <div className="font-semibold text-ink">
                  {s.name}{' '}
                  {s.display_code ? (
                    <span className="text-xs text-rose-500">({s.display_code})</span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500">{s.lat.toFixed(4)}, {s.lon.toFixed(4)}</div>
              </div>
              <button
                onClick={() => handleSelect(s.id)}
                className="text-sm font-semibold text-rose-600"
              >
                Detalji
              </button>
            </li>
          ))
        )}
      </ul>
      {!selectedStation && !loading && hasSearched && results.length === 0 ? (
        <div className="mt-3 text-sm text-slate-500">Nema rezultata za uneti pojam.</div>
      ) : null}
    </div>
  );
}
