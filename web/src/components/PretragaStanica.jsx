'use client';

import { useEffect, useState } from 'react';
import {
  dodajOmiljenuStanicu,
  dohvatiOmiljeneStanice,
  dohvatiStanice,
  dohvatiStanicu,
  ukloniOmiljenuStanicu
} from '../lib/api';

function StarIcon({ filled }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#e11d48"
          d="M12 2.75l2.87 5.82 6.43.93-4.65 4.53 1.1 6.4L12 17.4l-5.75 3.03 1.1-6.4L2.7 9.5l6.43-.93L12 2.75z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 2.75l2.87 5.82 6.43.93-4.65 4.53 1.1 6.4L12 17.4l-5.75 3.03 1.1-6.4L2.7 9.5l6.43-.93L12 2.75z"
        fill="none"
        stroke="#e11d48"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PretragaStanica({ onStationSelected, selectedStation, onClearSelection, auth }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const jePremium = auth?.token && auth?.korisnik?.uloga === 'premium';

  useEffect(() => {
    if (!jePremium) {
      setFavorites([]);
      setFavoriteIds([]);
      setShowFavoritesOnly(false);
      return;
    }
    ucitajOmiljene();
  }, [auth?.token, auth?.korisnik?.uloga]);

  async function ucitajOmiljene() {
    if (!auth?.token) return;
    try {
      const data = await dohvatiOmiljeneStanice(auth.token);
      const fav = Array.isArray(data) ? data : [];
      setFavorites(fav);
      setFavoriteIds(fav.map((s) => s.id));
    } catch (err) {
      setFavorites([]);
      setFavoriteIds([]);
    }
  }

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

  async function handleToggleFavorite(stationId) {
    if (!jePremium || !auth?.token) return;
    try {
      if (favoriteIds.includes(stationId)) {
        await ukloniOmiljenuStanicu(stationId, auth.token);
      } else {
        await dodajOmiljenuStanicu(stationId, auth.token);
      }
      await ucitajOmiljene();
    } catch (err) {
      // no-op
    }
  }

  return (
    <div className="surface-card rounded-3xl p-5 shadow-sm border border-rose/20">
      <div className="text-xs uppercase tracking-[0.3em] text-rose-400">Pretraga</div>
      <form onSubmit={handleSearch} className="mt-3 flex gap-3">
        <input
          className="input-surface flex-1 rounded-2xl border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-rose/40"
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

      {jePremium ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setShowFavoritesOnly(false)}
            className={`rounded-xl px-3 py-1 text-sm font-semibold ${!showFavoritesOnly ? 'bg-rose text-white' : 'border border-rose text-rose'
              }`}
          >
            Rezultati
          </button>
          <button
            type="button"
            onClick={() => setShowFavoritesOnly(true)}
            className={`rounded-xl px-3 py-1 text-sm font-semibold ${showFavoritesOnly ? 'bg-rose text-white' : 'border border-rose text-rose'
              }`}
          >
            Omiljene
          </button>
        </div>
      ) : null}

      <div className="mt-4 text-sm text-muted">{loading ? 'Ucitavanje...' : ''}</div>
      <ul className="mt-3 space-y-2">
        {selectedStation ? (
          <li className="flex items-center justify-between rounded-2xl border border-rose/20 surface-strong px-4 py-3">
            <div>
              <div className="font-semibold text-ink">
                {selectedStation.name}{' '}
                {selectedStation.display_code ? (
                  <span className="text-xs text-rose-500">({selectedStation.display_code})</span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {jePremium ? (
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(selectedStation.id)}
                  className="rounded-md p-1 hover:bg-rose-50"
                  title="Dodaj ili ukloni iz omiljenih"
                >
                  <StarIcon filled={favoriteIds.includes(selectedStation.id)} />
                </button>
              ) : null}
              <button
                onClick={onClearSelection}
                className="rounded-xl bg-rose text-white px-3 py-1 text-sm font-semibold"
              >
                Promeni
              </button>
            </div>
          </li>
        ) : (
          (showFavoritesOnly ? favorites : results).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-2xl border border-rose/10 surface-strong px-4 py-3 hover:border-rose/30 transition"
            >
              <div>
                <div className="font-semibold text-ink">
                  {s.name}{' '}
                  {s.display_code ? (
                    <span className="text-xs text-rose-500">({s.display_code})</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {jePremium ? (
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(s.id)}
                    className="rounded-md p-1 hover:bg-rose-50"
                    title="Dodaj ili ukloni iz omiljenih"
                  >
                    <StarIcon filled={favoriteIds.includes(s.id)} />
                  </button>
                ) : null}
                <button
                  onClick={() => handleSelect(s.id)}
                  className="rounded-xl px-3 py-1 text-sm font-semibold border border-rose text-rose"
                >
                  Detalji
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {!selectedStation && !loading && showFavoritesOnly && favorites.length === 0 ? (
        <div className="mt-3 text-sm text-muted">Nemate omiljene stanice.</div>
      ) : null}
      {!selectedStation && !loading && !showFavoritesOnly && hasSearched && results.length === 0 ? (
        <div className="mt-3 text-sm text-muted">Nema rezultata za uneti pojam.</div>
      ) : null}
    </div>
  );
}
