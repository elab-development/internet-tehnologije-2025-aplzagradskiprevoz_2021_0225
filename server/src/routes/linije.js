import express from 'express';
import { zahtevajPrijavu, zahtevajUlogu } from '../middleware/auth.js';
import {
  dohvatiExternalIdStanice,
  dohvatiFallbackGeometrijuLinije,
  dohvatiFallbackStaniceZaLiniju,
  dohvatiGeojsonPoShapeId,
  dohvatiLinije,
  dohvatiLinijuPoId,
  dohvatiNajboljiTrip,
  dohvatiStaniceZaTrip,
  dohvatiStatusGuzveLinije,
  upisiStatusGuzveLinije
} from '../repositories/linijeRepo.js';

const router = express.Router();

const dbToApiStatus = {
  none: 'nema',
  low: 'mala',
  medium: 'srednja',
  high: 'velika',
  unknown: 'nepoznato'
};

const apiToDbStatus = {
  none: 'none',
  low: 'low',
  medium: 'medium',
  high: 'high',
  nema: 'none',
  mala: 'low',
  srednja: 'medium',
  velika: 'high'
};

function bezbednoParsiranjeGeojson(geojsonText) {
  if (!geojsonText) return null;
  if (typeof geojsonText === 'object') return geojsonText;
  try {
    return JSON.parse(geojsonText);
  } catch (err) {
    return null;
  }
}

router.get('/', async (req, res) => {
  const query = (req.query.query || '').trim();
  try {
    const rows = await dohvatiLinije(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lines' });
  }
});

router.get('/:id/trasa', async (req, res) => {
  const id = Number(req.params.id);
  const stationId = Number(req.query.stationId || 0);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const line = await dohvatiLinijuPoId(id);
    if (!line) return res.status(404).json({ error: 'Not found' });

    let shapeGeojson = null;
    let stationsRes = null;

    if (stationId) {
      const stationExternalId = await dohvatiExternalIdStanice(stationId);

      if (stationExternalId) {
        const najboljiTrip = await dohvatiNajboljiTrip(line.external_id, stationExternalId);
        const tripId = najboljiTrip?.trip_id;
        const shapeId = najboljiTrip?.shape_id;

        if (shapeId) {
          const shapeRes = await dohvatiGeojsonPoShapeId(shapeId);
          shapeGeojson = shapeRes?.geojson || null;
        }

        if (tripId) {
          stationsRes = await dohvatiStaniceZaTrip(tripId);
        }
      }
    }

    if (!shapeGeojson) {
      const shapeRes = await dohvatiFallbackGeometrijuLinije(id);
      shapeGeojson = shapeRes?.geojson || null;
    }

    if (!stationsRes || stationsRes.length === 0) {
      stationsRes = await dohvatiFallbackStaniceZaLiniju(id);
    }

    res.json({
      line,
      shape: bezbednoParsiranjeGeojson(shapeGeojson),
      stations: stationsRes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch line shape' });
  }
});

router.get('/:id/guzva', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const row = await dohvatiStatusGuzveLinije(id);
    if (!row) return res.json({ status: 'nepoznato' });
    const status = dbToApiStatus[row.status] || 'nepoznato';
    res.json({ ...row, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crowd status' });
  }
});

router.post('/:id/guzva', zahtevajPrijavu, zahtevajUlogu(['vozac']), async (req, res) => {
  const id = Number(req.params.id);
  const ulazniStatus = String(req.body.status || '').toLowerCase();
  const status = apiToDbStatus[ulazniStatus];
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  if (!status) return res.status(400).json({ error: 'Invalid status' });

  try {
    await upisiStatusGuzveLinije(id, status);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update crowd status' });
  }
});

export default router;
