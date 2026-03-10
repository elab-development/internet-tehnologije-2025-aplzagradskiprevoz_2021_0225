'use client';

import { useState } from 'react';
import { prijaviKorisnika, promeniKorisnickuLozinku, registrujKorisnika } from '../lib/api';

export default function AuthPanel({ auth, onAuthChange, onLogout }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [korisnickoIme, setKorisnickoIme] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [staraLozinka, setStaraLozinka] = useState('');
  const [novaLozinka, setNovaLozinka] = useState('');
  const [potvrdaLozinke, setPotvrdaLozinke] = useState('');
  const [changeMessage, setChangeMessage] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    async function onChangePasswordSubmit(e) {
      e.preventDefault();
      if (!auth?.token) return;
      setChangeLoading(true);
      setChangeMessage('');
      setChangeError('');
      try {
        await promeniKorisnickuLozinku(
          {
            staraLozinka,
            novaLozinka,
            potvrdaLozinke
          },
          auth.token
        );
        setStaraLozinka('');
        setNovaLozinka('');
        setPotvrdaLozinke('');
        setOpenChangePassword(false);
        setChangeMessage('Lozinka je uspesno promenjena.');
      } catch (err) {
        setChangeError(err.message || 'Promena lozinke nije uspela');
      } finally {
        setChangeLoading(false);
      }
    }

    return (
      <div className="relative rounded-2xl border border-rose/20 surface-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold">{auth.korisnik.korisnickoIme}</span>{' '}
            <span className="text-rose-600">(premium)</span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={`rounded-lg px-2 py-1 ${menuOpen ? 'bg-rose text-white' : 'text-rose-600 hover:bg-rose-50'
              }`}
            aria-label="Meni"
          >
            <span className="flex flex-col items-center justify-center gap-[2px]">
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
            </span>
          </button>
        </div>

        {menuOpen ? (
          <div className="absolute right-4 top-11 z-[1400] w-44 rounded-xl border border-rose/20 surface-strong p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setOpenChangePassword(true);
                setChangeError('');
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Promena šifre
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
            >
              Odjava
            </button>
          </div>
        ) : null}

        {changeMessage ? <div className="mt-2 text-xs text-emerald-700">{changeMessage}</div> : null}

        {openChangePassword ? (
          <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/35 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-rose/20 surface-strong p-4 shadow-xl">
              <div className="mb-3 text-base font-semibold text-ink">Promena šifre</div>
              <form onSubmit={onChangePasswordSubmit} className="space-y-2">
                <input
                  type="password"
                  placeholder="Stara lozinka"
                  value={staraLozinka}
                  onChange={(e) => setStaraLozinka(e.target.value)}
                  className="input-surface w-full rounded-xl border px-3 py-2"
                  required
                />
                <input
                  type="password"
                  placeholder="Nova lozinka"
                  value={novaLozinka}
                  onChange={(e) => setNovaLozinka(e.target.value)}
                  className="input-surface w-full rounded-xl border px-3 py-2"
                  required
                />
                <input
                  type="password"
                  placeholder="Potvrda nove lozinke"
                  value={potvrdaLozinke}
                  onChange={(e) => setPotvrdaLozinke(e.target.value)}
                  className="input-surface w-full rounded-xl border px-3 py-2"
                  required
                />
                {changeError ? <div className="text-xs text-red-600">{changeError}</div> : null}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpenChangePassword(false)}
                    className="rounded-xl border border-rose px-3 py-2 text-sm font-semibold text-rose"
                  >
                    Otkazi
                  </button>
                  <button
                    type="submit"
                    disabled={changeLoading}
                    className="rounded-xl bg-rose text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    {changeLoading ? 'Slanje...' : 'Sačuvaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative z-[1200]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl bg-rose text-white px-4 py-2 text-sm font-semibold shadow-sm"
      >
        Premium prijava
      </button>

      {open ? (
        <div className="absolute right-0 z-[1300] mt-2 w-[320px] rounded-2xl border border-rose/20 surface-strong p-4 shadow-lg">
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-xl px-3 py-1 text-sm font-semibold ${mode === 'login' ? 'bg-rose text-white' : 'border border-rose text-rose'
                }`}
              onClick={() => setMode('login')}
            >
              Prijava
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-1 text-sm font-semibold ${mode === 'register' ? 'bg-rose text-white' : 'border border-rose text-rose'
                }`}
              onClick={() => setMode('register')}
            >
              Registracija
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-3 space-y-2">
            <input
              className="input-surface w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
              placeholder="Korisnicko ime"
              value={korisnickoIme}
              onChange={(e) => setKorisnickoIme(e.target.value)}
              required
            />
            <input
              className="input-surface w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose/40"
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
