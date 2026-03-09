# Veb aplikacija za gradski prevoz u Beogradu

## Opis
Aplikacija omogucava:
- pretragu stanica i prikaz linija na stanici
- prikaz trase linije na mapi (Leaflet + OpenStreetMap)
- klik na stanicu na mapi za promenu aktivne stanice
- prikaz statusa guzve po liniji (samo prijavljen korisnik)
- premium naloge (registracija + login)
- omiljene stanice za premium korisnike (zvezdica + poseban prikaz "Omiljene")
- vozac portal na `/vozac`:
  - login vozaca
  - obavezna promena lozinke na prvom loginu
  - dodeljena dnevna linija
  - upis statusa guzve samo za dodeljenu liniju
  - redovna promena lozinke

## Tehnologije
- `web/`: Next.js + React + Tailwind
- `server/`: Node.js + Express + pg
- `db`: PostgreSQL + PostGIS (Docker)

## Pokretanje (lokalno)

### 1) Podesi env fajlove

`web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2) Pokreni bazu
```bash
docker compose up -d db
```

### 3) Pokreni backend
```bash
cd server
npm install
npm run dev
```
Backend: `http://localhost:4000`

### 4) Pokreni frontend
```bash
cd web
npm install
npm run dev
```
Frontend: `http://localhost:3000`

## API rute

### Health
- `GET /health`

### Auth (premium korisnik)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/promeni-lozinku` (zahteva Bearer token)

### Vozac
- `POST /vozac/login`
- `GET /vozac/moja-linija` (vozac token)
- `POST /vozac/moja-linija/guzva` (vozac token)
- `POST /vozac/promeni-lozinku` (vozac token, prvi login flow)

### Stanice
- `GET /stanice?query=...`
- `GET /stanice/:id`
- `GET /stanice/:id/linije`
- `GET /stanice/omiljene` (premium token)
- `POST /stanice/:id/omiljena` (premium token)
- `DELETE /stanice/:id/omiljena` (premium token)

### Linije
- `GET /linije?query=...`
- `GET /linije/:id/trasa`
- `GET /linije/:id/guzva` (prijavljen korisnik)
- `POST /linije/:id/guzva` (vozac token, samo dodeljena linija)
