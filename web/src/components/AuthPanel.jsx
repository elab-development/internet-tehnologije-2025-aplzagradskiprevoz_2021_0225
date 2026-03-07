'use client';

import { useState } from 'react';
import { prijaviKorisnika, registrujKorisnika } from '../lib/api';

export default function AuthPanel({ auth, onAuthChange, onLogout }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [korisnickoIme, setKorisnickoIme] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'register') {
        const data = await registrujKorisnika({ korisnickoIme, lozinka });
        onAuthChange(data);
        setMessage('Premium nalog je aktivan.');
      } else {
        const data = await prijaviKorisnika({ korisnickoIme, lozinka });
        onAuthChange(data);
        setMessage('Uspesna prijava.');
      }
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Doslo je do greske');
    } finally {
      setLoading(false);
    }
  }

  if (auth?.korisnik) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose/20 bg-white/90 px-4 py-2 shadow-sm">
        <div className="text-sm">
          <span className="font-semibold">{auth.korisnik.korisnickoIme}</span>{' '}
          <span className="text-rose-600">(premium)</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-rose text-rose px-3 py-1 text-sm font-semibold"
        >
          Odjava
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl bg-rose text-white px-4 py-2 text-sm font-semibold shadow-sm"
      >
        Premium prijava
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-2xl border border-rose/20 bg-white p-4 shadow-lg">
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-xl px-3 py-1 text-sm font-semibold ${
                mode === 'login' ? 'bg-rose text-white' : 'border border-rose text-rose'
              }`}
              onClick={() => setMode('login')}
            >
              Prijava
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-1 text-sm font-semibold ${
                mode === 'register' ? 'bg-rose text-white' : 'border border-rose text-rose'
              }`}
              onClick={() => setMode('register')}
            >
              Registracija
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-3 space-y-2">
            <input
              className="w-full rounded-xl border border-rose/30 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
              placeholder="Korisnicko ime"
              value={korisnickoIme}
              onChange={(e) => setKorisnickoIme(e.target.value)}
              required
            />
            <input
              className="w-full rounded-xl border border-rose/30 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
              type="password"
              placeholder="Lozinka"
              value={lozinka}
              onChange={(e) => setLozinka(e.target.value)}
              required
            />

            {error ? <div className="text-xs text-red-600">{error}</div> : null}
            {message ? <div className="text-xs text-emerald-700">{message}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-rose text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Slanje...' : mode === 'register' ? 'Registruj premium' : 'Prijavi se'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
