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
  uloga TEXT NOT NULL CHECK (uloga IN ('obican', 'premium'))
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
  brStanice INT,
  vozacId INT
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

ALTER TABLE Vozac
  ADD CONSTRAINT fk_vozac_trenutna_linija
  FOREIGN KEY (trenutnaLinijaID) REFERENCES Linija(brLinije) ON DELETE SET NULL;

ALTER TABLE Autobus
  ADD CONSTRAINT fk_autobus_linija
  FOREIGN KEY (idLinije) REFERENCES Linija(brLinije) ON DELETE SET NULL;

ALTER TABLE Obavestenje
  ADD CONSTRAINT fk_obavestenje_stanica
  FOREIGN KEY (brStanice) REFERENCES Stanica(brStanice) ON DELETE SET NULL;

ALTER TABLE Obavestenje
  ADD CONSTRAINT fk_obavestenje_vozac
  FOREIGN KEY (vozacId) REFERENCES Vozac(idVozaca) ON DELETE SET NULL;

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

CREATE OR REPLACE FUNCTION fn_korisnik_ekskluzivnost()
RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'vozac' THEN
    IF EXISTS (SELECT 1 FROM Putnik p WHERE p.korisnikId = NEW.korisnikId) THEN
      RAISE EXCEPTION 'Korisnik ne moze biti i Putnik i Vozac';
    END IF;
  ELSIF TG_TABLE_NAME = 'putnik' THEN
    IF EXISTS (SELECT 1 FROM Vozac v WHERE v.korisnikId = NEW.korisnikId) THEN
      RAISE EXCEPTION 'Korisnik ne moze biti i Putnik i Vozac';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vozac_ekskluzivnost
BEFORE INSERT OR UPDATE ON Vozac
FOR EACH ROW EXECUTE FUNCTION fn_korisnik_ekskluzivnost();

CREATE TRIGGER trg_putnik_ekskluzivnost
BEFORE INSERT OR UPDATE ON Putnik
FOR EACH ROW EXECUTE FUNCTION fn_korisnik_ekskluzivnost();
