import { pool } from '../db.js';

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

export async function kreirajKorisnika({ korisnickoIme, lozinkaHash, uloga, brojLicence }) {
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

    if (uloga === 'vozac') {
      await client.query(
        `
          INSERT INTO Vozac (korisnikId, brojLicence, jeAktivan)
          VALUES ($1, $2, TRUE)
        `,
        [korisnik.id, brojLicence]
      );
    } else {
      await client.query(
        `
          INSERT INTO Putnik (korisnikId, tipPutnika)
          VALUES ($1, $2)
        `,
        [korisnik.id, uloga]
      );
    }

    await client.query('COMMIT');
    return korisnik;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
