import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = (req.query.query || '').trim();
  try {
    const params = [];
    let sql = `SELECT id, code, name FROM lines`;
    if (query) {
      params.push(`%${query}%`);
      sql += ` WHERE code ILIKE $1 OR name ILIKE $1`;
    }
    sql += ' ORDER BY code LIMIT 20';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lines' });
  }
});

router.get('/:id/shape', async (req, res) => {
  const id = Number(req.params.id);
  const stationId = Number(req.query.stationId || 0);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const lineRes = await pool.query(
      `SELECT brLinije AS id, external_id, code, name FROM Linija WHERE brLinije = $1`,
      [id]
    );
    if (lineRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const line = lineRes.rows[0];

    let shapeRes = null;
    let stationsRes = null;

    if (stationId) {
      const stationRes = await pool.query(
        `SELECT external_id FROM Stanica WHERE brStanice = $1`,
        [stationId]
      );
      const stationExternalId = stationRes.rows[0]?.external_id;

      if (stationExternalId) {
        const tripRes = await pool.query(
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
          [line.external_id, stationExternalId]
        );

        const tripId = tripRes.rows[0]?.trip_id;
        const shapeId = tripRes.rows[0]?.shape_id;

        if (shapeId) {
          shapeRes = await pool.query(
            `SELECT ST_AsGeoJSON(ST_SetSRID(ST_MakeLine(ARRAY_AGG(ST_MakePoint(shape_pt_lon, shape_pt_lat) ORDER BY shape_pt_sequence)), 4326)) AS geojson
             FROM gtfs_shapes WHERE shape_id = $1`,
            [shapeId]
          );
        }

        if (tripId) {
          stationsRes = await pool.query(
            `
            SELECT s.brStanice AS id, s.nazivStanice AS name, s.lat, s.lon, st.stop_sequence AS stop_order
            FROM gtfs_stop_times st
            JOIN Stanica s ON s.external_id = st.stop_id
            WHERE st.trip_id = $1
            ORDER BY st.stop_sequence
            `,
            [tripId]
          );
        }
      }
    }

    if (!shapeRes) {
      shapeRes = await pool.query(
        `SELECT ST_AsGeoJSON(geom) AS geojson FROM line_shapes WHERE brLinije = $1`,
        [id]
      );
    }

    if (!stationsRes) {
      stationsRes = await pool.query(
        `
        SELECT s.brStanice AS id, s.nazivStanice AS name, s.lat, s.lon, t.redniBroj AS stop_order
        FROM Trasa t
        JOIN Stanica s ON s.brStanice = t.brStanice
        WHERE t.brLinije = $1
        ORDER BY t.redniBroj
        `,
        [id]
      );
    }

    res.json({
      line,
      shape: shapeRes.rows[0]?.geojson ? JSON.parse(shapeRes.rows[0].geojson) : null,
      stations: stationsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch line shape' });
  }
});

router.get('/:id/crowd', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const { rows } = await pool.query(
      `SELECT status, updated_at FROM line_crowd_status WHERE brLinije = $1`,
      [id]
    );
    if (rows.length === 0) return res.json({ status: 'unknown' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crowd status' });
  }
});

router.post('/:id/crowd', async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || '').toLowerCase();
  const allowed = new Set(['none', 'low', 'medium', 'high']);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    await pool.query(
      `
      INSERT INTO line_crowd_status (brLinije, status, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (brLinije) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
      `,
      [id, status]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update crowd status' });
  }
});

export default router;
