'use client';

import { useState } from 'react';
import { dohvatiTrasuLinije, dohvatiStatusGuzve, postaviStatusGuzve } from '../lib/api';

const crowdOptions = [
  { value: 'nema', label: 'Nema' },
  { value: 'mala', label: 'Mala' },
  { value: 'srednja', label: 'Srednja' },
  { value: 'velika', label: 'Velika' }
];

export default function DetaljiLinije({ lines, onLineSelected, selectedStationId, auth }) {
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [crowd, setCrowd] = useState(null);
  const [novoStanjeGuzve, setNovoStanjeGuzve] = useState('mala');
  const [upisStatusa, setUpisStatusa] = useState('');
  const [greskaUpisa, setGreskaUpisa] = useState('');

  const jeVozac = auth?.korisnik?.uloga === 'vozac';

  async function handleLine(lineId) {
    setSelectedLineId(lineId);
    const data = await dohvatiTrasuLinije(lineId, selectedStationId);
    onLineSelected(data);
    const crowdData = await dohvatiStatusGuzve(lineId);
    setCrowd(crowdData.status || 'nepoznato');
  }

  async function handleSnimiGuzvu() {
    if (!selectedLineId || !auth?.token) return;

    setUpisStatusa('');
    setGreskaUpisa('');
    try {
      await postaviStatusGuzve(selectedLineId, novoStanjeGuzve, auth.token);
      setCrowd(novoStanjeGuzve);
      setUpisStatusa('Status je uspesno azuriran.');
    } catch (err) {
      setGreskaUpisa(err.message || 'Upis statusa nije uspeo');
    }
  }

  return (
    <div className="bg-white/80 rounded-2xl p-5 shadow-sm">
      <div className="font-semibold text-lg">Linije na stanici</div>
      {lines.length === 0 ? (
        <div className="mt-3 text-sm text-slate-500">Nema linija za izabranu stanicu.</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{l.code}</div>
                <div className="text-xs text-slate-500">{l.name}</div>
              </div>
              <button
                onClick={() => handleLine(l.id)}
                className={`rounded-xl px-3 py-1 text-sm font-semibold ${
                  selectedLineId === l.id ? 'bg-rose text-white' : 'border border-rose text-rose'
                }`}
              >
                Prikazi trasu
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedLineId && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm">
          Status guzve: <span className="font-semibold">{crowd || 'nepoznato'}</span>
          {jeVozac ? (
            <div className="mt-3 space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Unos vozaca</div>
              <div className="flex gap-2">
                <select
                  className="rounded-xl border border-rose/30 bg-white px-3 py-1"
                  value={novoStanjeGuzve}
                  onChange={(e) => setNovoStanjeGuzve(e.target.value)}
                >
                  {crowdOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSnimiGuzvu}
                  className="rounded-xl bg-rose text-white px-3 py-1 font-semibold"
                >
                  Snimi
                </button>
              </div>
              {upisStatusa ? <div className="text-xs text-emerald-700">{upisStatusa}</div> : null}
              {greskaUpisa ? <div className="text-xs text-red-600">{greskaUpisa}</div> : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
