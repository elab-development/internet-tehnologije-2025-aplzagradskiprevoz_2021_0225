import { pool } from '../db.js';
import bcrypt from 'bcryptjs';

export async function pronadjiKorisnikaPoKorisnickomImenu(korisnickoIme) {
  const { rows } = await pool.query(
    `
      SELECT idKorisnika AS id, korisnickoIme AS username, lozinka AS password_hash, uloga AS role
      FROM Korisnik
      WHERE LOWER(korisnickoIme) = LOWER($1)
    `,
    [korisnickoIme]
  );

  return rows[0] || null;
}

export async function kreirajKorisnika({ korisnickoIme, lozinkaHash, uloga }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const korisnikRes = await client.query(
      `
        INSERT INTO Korisnik (korisnickoIme, lozinka, uloga)
        VALUES ($1, $2, $3)
        RETURNING idKorisnika AS id, korisnickoIme AS username, uloga AS role
      `,
      [korisnickoIme, lozinkaHash, uloga]
    );

    const korisnik = korisnikRes.rows[0];

    await client.query(
      `
        INSERT INTO Putnik (korisnikId, tipPutnika)
        VALUES ($1, $2)
      `,
      [korisnik.id, uloga]
    );

    await client.query('COMMIT');
    return korisnik;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const PREDEFINISANI_VOZACI = [
  { username: 'vozac1', password: 'vozac1', brojLicence: 'LIC-0001' },
  { username: 'vozac2', password: 'vozac2', brojLicence: 'LIC-0002' },
  { username: 'vozac3', password: 'vozac3', brojLicence: 'LIC-0003' },
  { username: 'vozac4', password: 'vozac4', brojLicence: 'LIC-0004' },
  { username: 'vozac5', password: 'vozac5', brojLicence: 'LIC-0005' }
];

export async function osigurajPreddefinisaneVozace() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS vozac_dnevna_linija (
        id SERIAL PRIMARY KEY,
        vozac_id INT NOT NULL REFERENCES Vozac(idVozaca) ON DELETE CASCADE,
        datum DATE NOT NULL,
        brLinije INT NOT NULL REFERENCES Linija(brLinije) ON DELETE CASCADE,
        UNIQUE (vozac_id, datum)
      )
    `);

    for (const vozac of PREDEFINISANI_VOZACI) {
      let korisnikRes = await client.query(
        `
          SELECT idKorisnika AS id
          FROM Korisnik
          WHERE LOWER(korisnickoIme) = LOWER($1)
        `,
        [vozac.username]
      );

      let korisnikId = korisnikRes.rows[0]?.id || null;

      if (!korisnikId) {
        const lozinkaHash = await bcrypt.hash(vozac.password, 10);
        const insertRes = await client.query(
          `
            INSERT INTO Korisnik (korisnickoIme, lozinka, uloga)
            VALUES ($1, $2, 'premium')
            RETURNING idKorisnika AS id
          `,
          [vozac.username, lozinkaHash]
        );
        korisnikId = insertRes.rows[0].id;
      }

      const vozacRes = await client.query(
        `
          SELECT idVozaca AS id
          FROM Vozac
          WHERE korisnikId = $1
        `,
        [korisnikId]
      );

      if (!vozacRes.rows[0]) {
        await client.query(
          `
            INSERT INTO Vozac (korisnikId, brojLicence, jeAktivan)
            VALUES ($1, $2, TRUE)
          `,
          [korisnikId, vozac.brojLicence]
        );
      }
    }
  } finally {
    client.release();
  }
}
