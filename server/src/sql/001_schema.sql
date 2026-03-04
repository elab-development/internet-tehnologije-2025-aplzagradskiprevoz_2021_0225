CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS line_crowd_status;
DROP TABLE IF EXISTS Trasa;
DROP TABLE IF EXISTS line_shapes;
DROP TABLE IF EXISTS Stanica;
DROP TABLE IF EXISTS Linija;
DROP TABLE IF EXISTS Obavestenje;
DROP TABLE IF EXISTS Autobus;
DROP TABLE IF EXISTS Putnik;
DROP TABLE IF EXISTS Vozac;
DROP TABLE IF EXISTS Korisnik;

CREATE TABLE Korisnik (
  idKorisnika SERIAL PRIMARY KEY,
  korisnickoIme TEXT NOT NULL UNIQUE,
  lozinka TEXT NOT NULL,
  uloga TEXT NOT NULL CHECK (uloga IN ('obican', 'premium', 'vozac'))
);

CREATE TABLE Vozac (
  idVozaca SERIAL PRIMARY KEY,
  korisnikId INT NOT NULL UNIQUE REFERENCES Korisnik(idKorisnika) ON DELETE CASCADE,
  brojLicence TEXT NOT NULL UNIQUE,
  jeAktivan BOOLEAN DEFAULT TRUE,
  trenutnaLinijaID INT
);

CREATE TABLE Putnik (
  idPutnika SERIAL PRIMARY KEY,
  korisnikId INT NOT NULL UNIQUE REFERENCES Korisnik(idKorisnika) ON DELETE CASCADE,
  tipPutnika TEXT NOT NULL CHECK (tipPutnika IN ('obican', 'premium')),
  omiljeneStanice INT[] DEFAULT '{}'
);

CREATE TABLE Autobus (
  idAutobusa SERIAL PRIMARY KEY,
  idLinije INT,
  popunjenost INT
);

CREATE TABLE Obavestenje (
  idObavestenja SERIAL PRIMARY KEY,
  poruka TEXT,
  jeProcitano BOOLEAN DEFAULT FALSE,
  brStanice INT
);

CREATE TABLE Stanica (
  brStanice SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  code TEXT,
  nazivStanice TEXT NOT NULL,
  lokacijaStanice TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) NOT NULL
);

CREATE TABLE Linija (
  brLinije SERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  vrstaVozila TEXT
);

CREATE TABLE line_shapes (
  brLinije INT PRIMARY KEY REFERENCES Linija(brLinije) ON DELETE CASCADE,
  geom GEOMETRY(LineString, 4326) NOT NULL
);

CREATE TABLE Trasa (
  idTrase SERIAL PRIMARY KEY,
  brLinije INT REFERENCES Linija(brLinije) ON DELETE CASCADE,
  brStanice INT REFERENCES Stanica(brStanice) ON DELETE CASCADE,
  redniBroj INT NOT NULL
);

CREATE TABLE line_crowd_status (
  brLinije INT PRIMARY KEY REFERENCES Linija(brLinije) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('none','low','medium','high')),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stanice_naziv ON Stanica USING btree (nazivStanice);
CREATE INDEX idx_stanice_external_id ON Stanica USING btree (external_id);
CREATE INDEX idx_linije_external_id ON Linija USING btree (external_id);
CREATE INDEX idx_stanice_geom ON Stanica USING gist (geom);
CREATE INDEX idx_line_shapes_geom ON line_shapes USING gist (geom);
