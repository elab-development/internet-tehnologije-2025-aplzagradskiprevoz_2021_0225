import { pool } from '../db.js';
import { upisiStatusGuzveLinije, dohvatiStatusGuzveLinije } from './linijeRepo.js';

function danasnjiDatumSrbija() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Belgrade' }).format(new Date());
}

function hashTeksta(tekst) {
  let hash = 0;
  for (let i = 0; i < tekst.length; i += 1) {
    hash = (hash * 31 + tekst.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

export async function pronadjiVozacaPoKorisnickomImenu(korisnickoIme) {
  const { rows } = await pool.query(
    `
      SELECT
        k.idKorisnika AS user_id,
        k.korisnickoIme AS username,
        k.lozinka AS password_hash,
        v.idVozaca AS vozac_id,
        v.brojLicence AS broj_licence,
        v.must_change_password
      FROM Korisnik k
      JOIN Vozac v ON v.korisnikId = k.idKorisnika
      WHERE LOWER(k.korisnickoIme) = LOWER($1) AND v.jeAktivan = TRUE
    `,
    [korisnickoIme]
  );
  return rows[0] || null;
}

export async function dohvatiDnevnuLinijuZaVozaca(vozacId, datum = danasnjiDatumSrbija()) {
  const { rows } = await pool.query(
    `
      SELECT d.brLinije AS line_id, l.code, l.name
      FROM vozac_dnevna_linija d
      JOIN Linija l ON l.brLinije = d.brLinije
      WHERE d.vozac_id = $1 AND d.datum = $2::date
    `,
    [vozacId, datum]
  );
  return rows[0] || null;
}

export async function dodeliDnevnuLinijuAkoNedostaje(vozacId, datum = danasnjiDatumSrbija()) {
  const postojeca = await dohvatiDnevnuLinijuZaVozaca(vozacId, datum);
  if (postojeca) return postojeca;

  const linijeRes = await pool.query(
    `
      SELECT brLinije AS id
      FROM Linija
      ORDER BY brLinije
    `
  );
  const linije = linijeRes.rows;
  if (!linije.length) return null;

  const indeks = hashTeksta(`${vozacId}:${datum}`) % linije.length;
  const izabranaLinijaId = linije[indeks].id;

  await pool.query(
    `
      INSERT INTO vozac_dnevna_linija (vozac_id, datum, brLinije)
      VALUES ($1, $2::date, $3)
      ON CONFLICT (vozac_id, datum) DO NOTHING
    `,
    [vozacId, datum, izabranaLinijaId]
  );

  return dohvatiDnevnuLinijuZaVozaca(vozacId, datum);
}

export async function dohvatiVozacevStatusGuzve(vozacId, datum = danasnjiDatumSrbija()) {
  const linija = await dodeliDnevnuLinijuAkoNedostaje(vozacId, datum);
  if (!linija) return null;

  const status = await dohvatiStatusGuzveLinije(linija.line_id);
  return {
    line: linija,
    status: status?.status || 'unknown'
  };
}

export async function upisiVozacevStatusGuzve(vozacId, status, datum = danasnjiDatumSrbija()) {
  const linija = await dodeliDnevnuLinijuAkoNedostaje(vozacId, datum);
  if (!linija) return null;
  await upisiStatusGuzveLinije(linija.line_id, status);
  return linija;
}

export async function promeniLozinkuVozaca({ userId, vozacId, novaLozinkaHash }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `
        UPDATE Korisnik
        SET lozinka = $2
        WHERE idKorisnika = $1
      `,
      [userId, novaLozinkaHash]
    );

    await client.query(
      `
        UPDATE Vozac
        SET must_change_password = FALSE
        WHERE idVozaca = $1
      `,
      [vozacId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
