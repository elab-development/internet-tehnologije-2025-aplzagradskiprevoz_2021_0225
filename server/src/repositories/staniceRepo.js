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
