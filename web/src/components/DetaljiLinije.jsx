'use client';

import { useState } from 'react';
import { dohvatiTrasuLinije, dohvatiStatusGuzve } from '../lib/api';

export default function DetaljiLinije({ lines, onLineSelected, selectedStationId }) {
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [crowd, setCrowd] = useState(null);

  function formatCrowd(status) {
    switch ((status || '').toLowerCase()) {
      case 'none':
        return 'nema';
      case 'low':
        return 'mala';
      case 'medium':
        return 'srednja';
      case 'high':
        return 'velika';
      case 'unknown':
        return 'nepoznato';
      default:
        return status || 'nepoznato';
    }
  }

  async function handleLine(lineId) {
    setSelectedLineId(lineId);
    const data = await dohvatiTrasuLinije(lineId, selectedStationId);
    onLineSelected(data);
    const crowdData = await dohvatiStatusGuzve(lineId);
    setCrowd(crowdData.status || 'unknown');
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
                Prikaži trasu
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedLineId && (
        <div className="mt-4 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm">
          Status gužve: <span className="font-semibold">{formatCrowd(crowd)}</span>
        </div>
      )}
    </div>
  );
}
