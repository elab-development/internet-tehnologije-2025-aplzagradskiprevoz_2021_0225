'use client';

import { useEffect, useState } from 'react';
import {
  dohvatiVozacevuLiniju,
  prijaviVozaca,
  upisiVozacevuGuzvu
} from '../../lib/api';

const statusOpcije = [
  { value: 'nema', label: 'Nema' },
  { value: 'mala', label: 'Mala' },
  { value: 'srednja', label: 'Srednja' },
  { value: 'velika', label: 'Velika' }
];

export default function VozacPage() {
  const [auth, setAuth] = useState(null);
  const [korisnickoIme, setKorisnickoIme] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [linija, setLinija] = useState(null);
  const [statusGuzve, setStatusGuzve] = useState('nepoznato');
  const [izabraniStatus, setIzabraniStatus] = useState('mala');
  const [poruka, setPoruka] = useState('');
  const [greska, setGreska] = useState('');

  useEffect(() => {
    const sacuvano = localStorage.getItem('vozacAuth');
    if (!sacuvano) return;
    try {
      const data = JSON.parse(sacuvano);
      setAuth(data);
      ucitajLiniju(data.token);
    } catch (err) {
      localStorage.removeItem('vozacAuth');
    }
  }, []);

  async function ucitajLiniju(token) {
    const data = await dohvatiVozacevuLiniju(token);
    setLinija(data.line);
    setStatusGuzve(data.status || 'nepoznato');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setGreska('');
    setPoruka('');
    try {
      const data = await prijaviVozaca({ korisnickoIme, lozinka });
      setAuth(data);
      localStorage.setItem('vozacAuth', JSON.stringify(data));
      await ucitajLiniju(data.token);
    } catch (err) {
      setGreska(err.message || 'Prijava nije uspela');
    }
  }

  async function handleUpisStatusa() {
    if (!auth?.token) return;
    setGreska('');
    setPoruka('');
    try {
      await upisiVozacevuGuzvu(izabraniStatus, auth.token);
      await ucitajLiniju(auth.token);
      setPoruka('Status je uspesno sacuvan.');
    } catch (err) {
      setGreska(err.message || 'Upis nije uspeo');
    }
  }

  function handleOdjava() {
    setAuth(null);
    setLinija(null);
    setStatusGuzve('nepoznato');
    localStorage.removeItem('vozacAuth');
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-rose/20 bg-white/80 p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-ink">Vozac portal</h1>
          <p className="mt-2 text-sm text-slate-600">
            Test nalozi: vozac1, vozac2, vozac3, vozac4, vozac5 (lozinka je ista kao korisnicko ime).
          </p>
        </header>

        {!auth?.token ? (
          <section className="rounded-3xl border border-rose/20 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Prijava vozaca</h2>
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-rose/30 px-4 py-3"
                placeholder="Korisnicko ime"
                value={korisnickoIme}
                onChange={(e) => setKorisnickoIme(e.target.value)}
                required
              />
              <input
                className="w-full rounded-xl border border-rose/30 px-4 py-3"
                type="password"
                placeholder="Lozinka"
                value={lozinka}
                onChange={(e) => setLozinka(e.target.value)}
                required
              />
              {greska ? <div className="text-sm text-red-600">{greska}</div> : null}
              <button className="rounded-xl bg-rose px-4 py-2 font-semibold text-white" type="submit">
                Prijavi se
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-3xl border border-rose/20 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dodeljena linija za danas</h2>
              <button
                onClick={handleOdjava}
                className="rounded-xl border border-rose px-3 py-1 text-sm font-semibold text-rose"
                type="button"
              >
                Odjava
              </button>
            </div>

            {linija ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xl font-semibold">{linija.code}</div>
                <div className="text-sm text-slate-600">{linija.name}</div>
                <div className="mt-2 text-sm">
                  Trenutni status guzve: <span className="font-semibold">{statusGuzve}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-600">Linija jos nije dodeljena.</div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <select
                value={izabraniStatus}
                onChange={(e) => setIzabraniStatus(e.target.value)}
                className="rounded-xl border border-rose/30 bg-white px-3 py-2"
              >
                {statusOpcije.map((opcija) => (
                  <option key={opcija.value} value={opcija.value}>
                    {opcija.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpisStatusa}
                type="button"
                className="rounded-xl bg-rose px-4 py-2 font-semibold text-white"
              >
                Sacuvaj status
              </button>
            </div>

            {poruka ? <div className="mt-3 text-sm text-emerald-700">{poruka}</div> : null}
            {greska ? <div className="mt-3 text-sm text-red-600">{greska}</div> : null}
          </section>
        )}
      </div>
    </main>
  );
}
