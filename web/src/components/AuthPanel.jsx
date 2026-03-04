'use client';

import { useState } from 'react';
import { prijaviKorisnika, registrujKorisnika } from '../lib/api';

const roleOptions = [
  { value: 'obican', label: 'Obican korisnik' },
  { value: 'premium', label: 'Premium korisnik' },
  { value: 'vozac', label: 'Vozac' }
];

export default function AuthPanel({ auth, onAuthChange, onLogout }) {
  const [mode, setMode] = useState('login');
  const [korisnickoIme, setKorisnickoIme] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [uloga, setUloga] = useState('premium');
  const [brojLicence, setBrojLicence] = useState('');
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
        const data = await registrujKorisnika({
          korisnickoIme,
          lozinka,
          uloga,
          brojLicence: uloga === 'vozac' ? brojLicence : undefined
        });

        onAuthChange(data);
        setMessage('Uspesna registracija i prijava.');
      } else {
        const data = await prijaviKorisnika({ korisnickoIme, lozinka });
        onAuthChange(data);
        setMessage('Uspesna prijava.');
      }
    } catch (err) {
      setError(err.message || 'Doslo je do greske');
    } finally {
      setLoading(false);
    }
  }

  if (auth?.korisnik) {
    return (
      <div className="bg-white/80 rounded-3xl p-5 shadow-sm border border-rose/20 space-y-3">
        <div className="text-xs uppercase tracking-[0.3em] text-rose-400">Nalog</div>
        <div className="rounded-2xl border border-rose/20 bg-white px-4 py-3">
          <div className="font-semibold text-ink">{auth.korisnik.korisnickoIme}</div>
          <div className="text-sm text-slate-500">Uloga: {auth.korisnik.uloga}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-2xl border border-rose text-rose px-4 py-2 font-semibold"
        >
          Odjava
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 rounded-3xl p-5 shadow-sm border border-rose/20">
      <div className="text-xs uppercase tracking-[0.3em] text-rose-400">Prijava / Registracija</div>

      <div className="mt-3 flex gap-2">
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

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          className="w-full rounded-2xl border border-rose/30 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
          placeholder="Korisnicko ime"
          value={korisnickoIme}
          onChange={(e) => setKorisnickoIme(e.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border border-rose/30 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
          type="password"
          placeholder="Lozinka"
          value={lozinka}
          onChange={(e) => setLozinka(e.target.value)}
          required
        />

        {mode === 'register' ? (
          <>
            <select
              className="w-full rounded-2xl border border-rose/30 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
              value={uloga}
              onChange={(e) => setUloga(e.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            {uloga === 'vozac' ? (
              <input
                className="w-full rounded-2xl border border-rose/30 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
                placeholder="Broj licence"
                value={brojLicence}
                onChange={(e) => setBrojLicence(e.target.value)}
                required
              />
            ) : null}
          </>
        ) : null}

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {message ? <div className="text-sm text-emerald-700">{message}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-rose text-white px-4 py-2 font-semibold hover:bg-crimson transition disabled:opacity-60"
        >
          {loading ? 'Slanje...' : mode === 'register' ? 'Registruj se' : 'Prijavi se'}
        </button>
      </form>
    </div>
  );
}
