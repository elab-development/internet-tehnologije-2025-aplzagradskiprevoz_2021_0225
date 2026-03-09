# Veb aplikacija za gradski prevoz u Beogradu

## Opis
Aplikacija omogucava:
- pretragu stanica i prikaz linija na stanici
- prikaz trase linije na mapi (Leaflet + OpenStreetMap)
- klik na stanicu na mapi za promenu aktivne stanice
- prikaz statusa guzve po liniji (samo prijavljen korisnik)
- premium naloge (registracija + login)
- omiljene stanice za premium korisnike (zvezdica + prikaz "Omiljene")
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

Root `.env` (koristi `docker-compose.yml`):
```env
POSTGRES_USER=<your_postgres_user>
POSTGRES_PASSWORD=<your_postgres_password>
POSTGRES_DB=<your_postgres_db>
POSTGRES_PORT=<your_postgres_port>
JWT_SECRET=<your_jwt_secret>
NEXT_PUBLIC_API_URL=<your_public_api_url>
```

`server/.env`:
```env
PORT=<server_port>
DB_HOST=<db_host>
DB_PORT=<db_port>
DB_USER=<db_user>
DB_PASSWORD=<db_password>
DB_NAME=<db_name>
JWT_SECRET=<your_jwt_secret>
```

`web/.env.local`:
```env
NEXT_PUBLIC_API_URL=<your_public_api_url>
```

### 2) Pokreni kompletan stack preko Dockera
```bash
docker compose up -d --build
```

Servisi:
- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`
- baza: `localhost:5432`

### 3) Opcija: samo baza u Dockeru + lokalni dev za web/server
```bash
docker compose up -d db
```

Backend:
```bash
cd server
npm install
npm run dev
```

Frontend:
```bash
cd web
npm install
npm run dev
```

### 4) Clean reset baze
```bash
docker compose down -v
docker compose up -d db
```

## API rute

### Health
- `GET /health`
- `GET /openapi.json` (OpenAPI specifikacija)
- `GET /docs` (Swagger UI)

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