'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  dohvatiTrasuLinije,
  dohvatiVozacevuLiniju,
  promeniVozacevuLozinku,
  prijaviVozaca,
  upisiVozacevuGuzvu
} from '../../lib/api';

const Mapa = dynamic(() => import('../../components/Mapa'), { ssr: false });

const statusOpcije = [
  { value: 'nema', label: 'Nema' },
  { value: 'mala', label: 'Mala' },
  { value: 'srednja', label: 'Srednja' },
  { value: 'velika', label: 'Velika' }
];

function normalizeShape(shape) {
  if (!shape) return null;
  if (shape.type !== 'LineString') return shape;
  if (!Array.isArray(shape.coordinates) || shape.coordinates.length < 2) return null;
  return shape;
}

export default function VozacPage() {
  const [auth, setAuth] = useState(null);
  const [korisnickoIme, setKorisnickoIme] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [linija, setLinija] = useState(null);
  const [statusGuzve, setStatusGuzve] = useState('nepoznato');
  const [lineShape, setLineShape] = useState(null);
  const [lineStations, setLineStations] = useState([]);
  const [izabraniStatus, setIzabraniStatus] = useState('mala');
  const [novaLozinka, setNovaLozinka] = useState('');
  const [potvrdaLozinke, setPotvrdaLozinke] = useState('');
  const [poruka, setPoruka] = useState('');
  const [greska, setGreska] = useState('');

  useEffect(() => {
    const sacuvano = localStorage.getItem('vozacAuth');
    if (!sacuvano) return;
    try {
      const data = JSON.parse(sacuvano);
      setAuth(data);
      if (!data.mustChangePassword) {
        ucitajLiniju(data.token);
      }
    } catch (err) {
      localStorage.removeItem('vozacAuth');
    }
  }, []);

  async function ucitajLiniju(token) {
    const data = await dohvatiVozacevuLiniju(token);
    setLinija(data.line);
    setStatusGuzve(data.status || 'nepoznato');
    if (data?.line?.line_id) {
      try {
        const trasa = await dohvatiTrasuLinije(data.line.line_id);
        setLineShape(normalizeShape(trasa.shape));
        setLineStations(trasa.stations || []);
      } catch (err) {
        setLineShape(null);
        setLineStations([]);
      }
    } else {
      setLineShape(null);
      setLineStations([]);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setGreska('');
    setPoruka('');
    try {
      const data = await prijaviVozaca({ korisnickoIme, lozinka });
      setAuth(data);
      localStorage.setItem('vozacAuth', JSON.stringify(data));
      if (!data.mustChangePassword) {
        await ucitajLiniju(data.token);
      }
    } catch (err) {
      setGreska(err.message || 'Prijava nije uspela');
    }
  }

  async function handlePromenaLozinke(e) {
    e.preventDefault();
    if (!auth?.token) return;
    setGreska('');
    setPoruka('');
    try {
      const data = await promeniVozacevuLozinku(
        { novaLozinka, potvrdaLozinke: potvrdaLozinke },
        auth.token
      );
      const noviAuth = {
        ...auth,
        token: data.token,
        mustChangePassword: false
      };
      setAuth(noviAuth);
      localStorage.setItem('vozacAuth', JSON.stringify(noviAuth));
      setNovaLozinka('');
      setPotvrdaLozinke('');
      setPoruka('Lozinka je uspesno promenjena.');
      await ucitajLiniju(data.token);
    } catch (err) {
      setGreska(err.message || 'Promena lozinke nije uspela');
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
    setLineShape(null);
    setLineStations([]);
    localStorage.removeItem('vozacAuth');
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-rose/20 bg-white/80 p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-ink">Vozac portal</h1>
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
        ) : auth?.mustChangePassword ? (
          <section className="rounded-3xl border border-rose/20 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Obavezna promena šifre</h2>
            <p className="mt-2 text-sm text-slate-600">
              Pre nastavka rada unesite novu i potvrdite novu šifru.
            </p>
            <form onSubmit={handlePromenaLozinke} className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-rose/30 px-4 py-3"
                type="password"
                placeholder="Nova lozinka"
                value={novaLozinka}
                onChange={(e) => setNovaLozinka(e.target.value)}
                required
              />
              <input
                className="w-full rounded-xl border border-rose/30 px-4 py-3"
                type="password"
                placeholder="Potvrda nove lozinke"
                value={potvrdaLozinke}
                onChange={(e) => setPotvrdaLozinke(e.target.value)}
                required
              />
              {greska ? <div className="text-sm text-red-600">{greska}</div> : null}
              {poruka ? <div className="text-sm text-emerald-700">{poruka}</div> : null}
              <button className="rounded-xl bg-rose px-4 py-2 font-semibold text-white" type="submit">
                Sačuvaj novu šifru
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
                    Sačuvaj status
                  </button>
                </div>
                {poruka ? <div className="mt-3 text-sm text-emerald-700">{poruka}</div> : null}
                {greska ? <div className="mt-3 text-sm text-red-600">{greska}</div> : null}
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-600">Linija jos nije dodeljena.</div>
            )}

            {linija ? (
              <div className="mt-4 rounded-2xl border border-rose/20 bg-white/70 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-700">Trasa današnje linije</div>
                <Mapa
                  stations={[]}
                  selectedStationId={null}
                  selectedStation={null}
                  lineShape={lineShape}
                  lineStations={lineStations}
                />
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
