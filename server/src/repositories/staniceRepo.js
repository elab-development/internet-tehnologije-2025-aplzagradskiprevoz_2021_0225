import { pool } from '../db.js';

export async function dohvatiStanice(query) {
  const params = [];
  let sql = `
    SELECT
      brStanice AS id,
      code,
      external_id,
      nazivStanice AS name,
      lat,
      lon,
      CASE
        WHEN code IS NULL OR code = '' THEN NULL
        WHEN external_id IS NOT NULL AND code = external_id THEN NULL
        ELSE code
      END AS display_code
    FROM Stanica
  `;

  if (query) {
    params.push(`%${query}%`);
    params.push(query);
    sql += ` WHERE nazivStanice ILIKE $1 OR code ILIKE $1`;
    sql += `
      ORDER BY
        CASE
          WHEN code IS NOT NULL AND code <> '' AND LOWER(code) = LOWER($2) THEN 0
          WHEN LOWER(nazivStanice) = LOWER($2) THEN 1
          WHEN external_id IS NOT NULL AND LOWER(external_id) = LOWER($2) THEN 3
          ELSE 2
        END,
        nazivStanice
    `;
  } else {
    sql += ' ORDER BY nazivStanice';
  }

  sql += ' LIMIT 20';
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function dohvatiStanicuPoId(id) {
  const { rows } = await pool.query(
    `
    SELECT
      brStanice AS id,
      code,
      external_id,
      nazivStanice AS name,
      lat,
      lon,
      CASE
        WHEN code IS NULL OR code = '' THEN NULL
        WHEN external_id IS NOT NULL AND code = external_id THEN NULL
        ELSE code
      END AS display_code
    FROM Stanica
    WHERE brStanice = $1
    `,
    [id]
  );
  return rows[0] || null;
}

export async function dohvatiLinijeZaStanicu(id) {
  const { rows } = await pool.query(
    `
    SELECT l.brLinije AS id, l.code, l.name
    FROM Trasa t
    JOIN Linija l ON l.brLinije = t.brLinije
    WHERE t.brStanice = $1
    ORDER BY l.code
    `,
    [id]
  );
  return rows;
}

export async function dohvatiOmiljeneStaniceZaKorisnika(korisnikId) {
  const { rows } = await pool.query(
    `
    SELECT
      s.brStanice AS id,
      s.code,
      s.external_id,
      s.nazivStanice AS name,
      s.lat,
      s.lon,
      CASE
        WHEN s.code IS NULL OR s.code = '' THEN NULL
        WHEN s.external_id IS NOT NULL AND s.code = s.external_id THEN NULL
        ELSE s.code
      END AS display_code
    FROM Putnik p
    JOIN Stanica s ON s.brStanice = ANY(p.omiljeneStanice)
    WHERE p.korisnikId = $1
    ORDER BY s.nazivStanice
    `,
    [korisnikId]
  );
  return rows;
}

export async function dodajOmiljenuStanicu(korisnikId, stanicaId) {
  const { rows } = await pool.query(
    `
    UPDATE Putnik
    SET omiljeneStanice = CASE
      WHEN $2 = ANY(omiljeneStanice) THEN omiljeneStanice
      ELSE array_append(omiljeneStanice, $2)
    END
    WHERE korisnikId = $1
    RETURNING omiljeneStanice
    `,
    [korisnikId, stanicaId]
  );
  return rows[0] || null;
}

export async function ukloniOmiljenuStanicu(korisnikId, stanicaId) {
  const { rows } = await pool.query(
    `
    UPDATE Putnik
    SET omiljeneStanice = array_remove(omiljeneStanice, $2)
    WHERE korisnikId = $1
    RETURNING omiljeneStanice
    `,
    [korisnikId, stanicaId]
  );
  return rows[0] || null;
}
