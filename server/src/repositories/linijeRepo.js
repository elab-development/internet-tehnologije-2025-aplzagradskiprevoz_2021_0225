import { pool } from '../db.js';

export async function dohvatiLinije(query) {
  const params = [];
  let sql = `SELECT brLinije AS id, code, name FROM Linija`;
  if (query) {
    params.push(`%${query}%`);
    sql += ` WHERE code ILIKE $1 OR name ILIKE $1`;
  }
  sql += ' ORDER BY code LIMIT 20';

  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function dohvatiLinijuPoId(id) {
  const { rows } = await pool.query(
    `SELECT brLinije AS id, external_id, code, name FROM Linija WHERE brLinije = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function dohvatiExternalIdStanice(brStanice) {
  const { rows } = await pool.query(
    `SELECT external_id FROM Stanica WHERE brStanice = $1`,
    [brStanice]
  );
  return rows[0]?.external_id || null;
}

export async function dohvatiNajboljiTrip(routeId, stopId) {
  const { rows } = await pool.query(
    `
    WITH trip_candidates AS (
      SELECT t.trip_id, t.shape_id
      FROM gtfs_trips t
      JOIN gtfs_stop_times st ON st.trip_id = t.trip_id
      WHERE t.route_id = $1 AND st.stop_id = $2
    ),
    trip_counts AS (
      SELECT st.trip_id, COUNT(*) AS stop_count
      FROM gtfs_stop_times st
      JOIN trip_candidates tc ON tc.trip_id = st.trip_id
      GROUP BY st.trip_id
    ),
    best_trip AS (
      SELECT tc.trip_id, tc.shape_id
      FROM trip_candidates tc
      JOIN trip_counts c ON c.trip_id = tc.trip_id
      ORDER BY c.stop_count DESC
      LIMIT 1
    )
    SELECT trip_id, shape_id FROM best_trip
    `,
    [routeId, stopId]
  );
  return rows[0] || null;
}

export async function dohvatiGeojsonPoShapeId(shapeId) {
  const { rows } = await pool.query(
    `SELECT ST_AsGeoJSON(ST_SetSRID(ST_MakeLine(ARRAY_AGG(ST_MakePoint(shape_pt_lon, shape_pt_lat) ORDER BY shape_pt_sequence)), 4326)) AS geojson
     FROM gtfs_shapes WHERE shape_id = $1`,
    [shapeId]
  );
  return rows[0] || null;
}

export async function dohvatiStaniceZaTrip(tripId) {
  const { rows } = await pool.query(
    `
    SELECT s.brStanice AS id, s.nazivStanice AS name, s.lat, s.lon, st.stop_sequence AS stop_order
    FROM gtfs_stop_times st
    JOIN Stanica s ON s.external_id = st.stop_id
    WHERE st.trip_id = $1
    ORDER BY st.stop_sequence
    `,
    [tripId]
  );
  return rows;
}

export async function dohvatiFallbackGeometrijuLinije(brLinije) {
  const { rows } = await pool.query(
    `SELECT ST_AsGeoJSON(geom) AS geojson FROM line_shapes WHERE brLinije = $1`,
    [brLinije]
  );
  return rows[0] || null;
}

export async function dohvatiFallbackStaniceZaLiniju(brLinije) {
  const { rows } = await pool.query(
    `
    SELECT s.brStanice AS id, s.nazivStanice AS name, s.lat, s.lon, t.redniBroj AS stop_order
    FROM Trasa t
    JOIN Stanica s ON s.brStanice = t.brStanice
    WHERE t.brLinije = $1
    ORDER BY t.redniBroj
    `,
    [brLinije]
  );
  return rows;
}

export async function dohvatiStatusGuzveLinije(brLinije) {
  const { rows } = await pool.query(
    `SELECT status, updated_at FROM line_crowd_status WHERE brLinije = $1`,
    [brLinije]
  );
  return rows[0] || null;
}

export async function upisiStatusGuzveLinije(brLinije, status) {
  await pool.query(
    `
    INSERT INTO line_crowd_status (brLinije, status, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (brLinije) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
    `,
    [brLinije, status]
  );
}
