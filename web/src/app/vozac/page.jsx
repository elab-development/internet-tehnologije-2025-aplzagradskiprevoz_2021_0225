'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  dohvatiTrasuLinije,
  dohvatiVozacevuLiniju,
  promeniKorisnickuLozinku,
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

  const [staraLozinkaRedovna, setStaraLozinkaRedovna] = useState('');
  const [novaLozinkaRedovna, setNovaLozinkaRedovna] = useState('');
  const [potvrdaLozinkeRedovna, setPotvrdaLozinkeRedovna] = useState('');

  const [poruka, setPoruka] = useState('');
  const [greska, setGreska] = useState('');
  const [porukaLozinka, setPorukaLozinka] = useState('');
  const [greskaLozinka, setGreskaLozinka] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
  const [theme, setTheme] = useState('light');

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

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  async function handleObaveznaPromenaLozinke(e) {
    e.preventDefault();
    if (!auth?.token) return;
    setGreska('');
    setPoruka('');
    try {
      const data = await promeniVozacevuLozinku(
        { novaLozinka, potvrdaLozinke },
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

  async function handleRedovnaPromenaLozinke(e) {
    e.preventDefault();
    if (!auth?.token) return;
    setPorukaLozinka('');
    setGreskaLozinka('');
    try {
      await promeniKorisnickuLozinku(
        {
          staraLozinka: staraLozinkaRedovna,
          novaLozinka: novaLozinkaRedovna,
          potvrdaLozinke: potvrdaLozinkeRedovna
        },
        auth.token
      );
      setStaraLozinkaRedovna('');
      setNovaLozinkaRedovna('');
      setPotvrdaLozinkeRedovna('');
      setPorukaLozinka('Lozinka je uspesno promenjena.');
      setOpenChangePasswordModal(false);
    } catch (err) {
      setGreskaLozinka(err.message || 'Promena lozinke nije uspela');
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
        <header className="rounded-3xl border border-rose/20 surface-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-ink">VozaÄ portal</h1>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="theme-toggle rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition"
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 4.25a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 .75-.75zm0 12.5a.75.75 0 0 1 .75.75V19a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75zm7.75-4.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5H19a.75.75 0 0 1 .75.75zM6.5 12a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1 0-1.5H5.75a.75.75 0 0 1 .75.75zm9.19-5.44a.75.75 0 0 1 1.06 0l.88.88a.75.75 0 0 1-1.06 1.06l-.88-.88a.75.75 0 0 1 0-1.06zM7.37 15.56a.75.75 0 0 1 1.06 0l.88.88a.75.75 0 0 1-1.06 1.06l-.88-.88a.75.75 0 0 1 0-1.06zm9.19 1.94a.75.75 0 0 1 0 1.06l-.88.88a.75.75 0 1 1-1.06-1.06l.88-.88a.75.75 0 0 1 1.06 0zM8.43 6.5a.75.75 0 0 1 0 1.06l-.88.88a.75.75 0 1 1-1.06-1.06l.88-.88a.75.75 0 0 1 1.06 0zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21 14.25a.75.75 0 0 0-.98-.71 7 7 0 1 1-9.58-9.58.75.75 0 0 0-.71-.98 9 9 0 1 0 11.27 11.27z"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {!auth?.token ? (
          <section className="relative rounded-3xl border border-rose/20 surface-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Prijava vozaca</h2>
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <input
                className="input-surface w-full rounded-xl border px-4 py-3"
                placeholder="Korisnicko ime"
                value={korisnickoIme}
                onChange={(e) => setKorisnickoIme(e.target.value)}
                required
              />
              <input
                className="input-surface w-full rounded-xl border px-4 py-3"
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
          <section className="relative rounded-3xl border border-rose/20 surface-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Obavezna promena Å¡ifre</h2>
            <p className="mt-2 text-sm text-muted">
              Pre nastavka rada unesite novu sifru dva puta.
            </p>
            <form onSubmit={handleObaveznaPromenaLozinke} className="mt-4 space-y-3">
              <input
                className="input-surface w-full rounded-xl border px-4 py-3"
                type="password"
                placeholder="Nova lozinka"
                value={novaLozinka}
                onChange={(e) => setNovaLozinka(e.target.value)}
                required
              />
              <input
                className="input-surface w-full rounded-xl border px-4 py-3"
                type="password"
                placeholder="Potvrda nove lozinke"
                value={potvrdaLozinke}
                onChange={(e) => setPotvrdaLozinke(e.target.value)}
                required
              />
              {greska ? <div className="text-sm text-red-600">{greska}</div> : null}
              {poruka ? <div className="text-sm text-emerald-700">{poruka}</div> : null}
              <button className="rounded-xl bg-rose px-4 py-2 font-semibold text-white" type="submit">
                SaÄuvaj novu sifru
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-3xl border border-rose/20 surface-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dodeljena linija za danas</h2>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`rounded-lg px-2 py-1 ${menuOpen ? 'bg-rose text-white' : 'text-rose-600 hover:bg-rose-50'
                  }`}
                type="button"
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
              <div className="absolute right-10 mt-1 z-20 w-44 rounded-xl border border-rose/20 surface-strong p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenChangePasswordModal(true);
                    setGreskaLozinka('');
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Promena Å¡ifre
                </button>
                <button
                  type="button"
                  onClick={handleOdjava}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Odjava
                </button>
              </div>
            ) : null}

            {linija ? (
              <div className="mt-4 rounded-xl border border-rose/20 surface-strong px-4 py-3">
                <div className="text-xl font-semibold">{linija.code}</div>
                <div className="text-sm text-muted">{linija.name}</div>
                <div className="mt-2 text-sm">
                  Trenutni status guzve: <span className="font-semibold">{statusGuzve}</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <select
                    value={izabraniStatus}
                    onChange={(e) => setIzabraniStatus(e.target.value)}
                    className="input-surface rounded-xl border px-3 py-2"
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
                    SaÄuvaj status
                  </button>
                </div>
                {poruka ? <div className="mt-3 text-sm text-emerald-700">{poruka}</div> : null}
                {greska ? <div className="mt-3 text-sm text-red-600">{greska}</div> : null}
              </div>
            ) : (
              <div className="mt-4 text-sm text-muted">Linija jos nije dodeljena.</div>
            )}

            {linija ? (
              <div className="mt-4 rounded-2xl border border-rose/20 surface-strong p-3">
                <div className="mb-2 text-sm font-semibold text-muted">Trasa danaÅ¡nje linije</div>
                <Mapa
                  stations={[]}
                  selectedStationId={null}
                  selectedStation={null}
                  lineShape={lineShape}
                  lineStations={lineStations}
                  theme={theme}
                />
              </div>
            ) : null}

            {porukaLozinka ? <div className="mt-3 text-sm text-emerald-700">{porukaLozinka}</div> : null}
          </section>
        )}
      </div>
      {openChangePasswordModal ? (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose/20 surface-strong p-4 shadow-xl">
            <div className="mb-3 text-base font-semibold text-ink">Promena Å¡ifre</div>
            <form onSubmit={handleRedovnaPromenaLozinke} className="space-y-2">
              <input
                className="input-surface w-full rounded-xl border px-3 py-2"
                type="password"
                placeholder="Stara lozinka"
                value={staraLozinkaRedovna}
                onChange={(e) => setStaraLozinkaRedovna(e.target.value)}
                required
              />
              <input
                className="input-surface w-full rounded-xl border px-3 py-2"
                type="password"
                placeholder="Nova lozinka"
                value={novaLozinkaRedovna}
                onChange={(e) => setNovaLozinkaRedovna(e.target.value)}
                required
              />
              <input
                className="input-surface w-full rounded-xl border px-3 py-2"
                type="password"
                placeholder="Potvrda nove lozinke"
                value={potvrdaLozinkeRedovna}
                onChange={(e) => setPotvrdaLozinkeRedovna(e.target.value)}
                required
              />
              {greskaLozinka ? <div className="text-sm text-red-600">{greskaLozinka}</div> : null}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenChangePasswordModal(false)}
                  className="rounded-xl border border-rose px-3 py-2 text-sm font-semibold text-rose"
                >
                  Otkazi
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose px-4 py-2 text-sm font-semibold text-white"
                >
                  SaÄuvaj
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
