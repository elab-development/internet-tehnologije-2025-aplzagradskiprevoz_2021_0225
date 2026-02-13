# Veb aplikacija za gradski prevoz u Beogradu (MVP)

MVP aplikacije omogucava:
- pretragu stanica po nazivu
- prikaz informacija o stanici
- prikaz linija koje staju na stanici
- prikaz stanica i trase linije na mapi (Leaflet + OpenStreetMap)
- pregled trenutnog statusa popunjenosti linije (demo)

## Struktura
- `web/` Next.js (React + Tailwind)
- `server/` Express REST API
- `docker-compose.yml` Postgres + PostGIS

## Pokretanje (lokalno)

1) Pokreni bazu
```bash
docker compose up -d db
```
Pre pokretanja kopiraj `.env.example` u `.env` i unesi kredencijale za bazu.

2) Pokreni backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Backend radi na `http://localhost:4000`.

3) Pokreni frontend
```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```
Frontend radi na `http://localhost:3000`.

## API rute (osnovno)
- `GET /health`
- `GET /stanice?query=...`
- `GET /stanice/:id`
- `GET /stanice/:id/linije`
- `GET /linije?query=...`
- `GET /linije/:id/shape`
- `GET /linije/:id/crowd`
- `POST /linije/:id/crowd` `{ "status": "none|low|medium|high" }`

## Napomena o Git obavezama
Zahtev za minimum 10 smislenih komitova i komitovanje od svih clanova tima morate uraditi rucno u toku rada.

## Dokumentacija
Privremena dokumentacija je u `docs/Faza1.md`. Zamenite je template-om iz priloga cim ga obezbedite.

## Demo scenario

1. Korisnik pretražuje stanicu po nazivu.
2. Aplikacija prikazuje detalje stanice.
3. Prikazuju se linije koje staju na stanici.
4. Klikom na liniju prikazuje se trasa na mapi.
5. Može se videti i demo status popunjenosti linije.
