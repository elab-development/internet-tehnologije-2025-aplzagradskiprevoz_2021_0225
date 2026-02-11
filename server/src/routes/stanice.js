import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = (req.query.query || '').trim();
  try {
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
    res.json(rows);
  } catch (err) {
    console.error('GET /stanice failed', err);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const stationRes = await pool.query(
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
    if (stationRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const linesRes = await pool.query(
      `
      SELECT l.brLinije AS id, l.code, l.name
      FROM Trasa t
      JOIN Linija l ON l.brLinije = t.brLinije
      WHERE t.brStanice = $1
      ORDER BY l.code
      `,
      [id]
    );

    res.json({ station: stationRes.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error('GET /stanice/:id failed', err);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

router.get('/:id/linije', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
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
    res.json(rows);
  } catch (err) {
    console.error('GET /stanice/:id/linije failed', err);
    res.status(500).json({ error: 'Failed to fetch station lines' });
  }
});

export default router;
