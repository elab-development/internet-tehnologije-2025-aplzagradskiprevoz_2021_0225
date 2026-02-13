import express from 'express';
import {
  dohvatiLinijeZaStanicu,
  dohvatiStanice,
  dohvatiStanicuPoId
} from '../repositories/staniceRepo.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = (req.query.query || '').trim();
  try {
    const rows = await dohvatiStanice(query);
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
    const station = await dohvatiStanicuPoId(id);
    if (!station) return res.status(404).json({ error: 'Not found' });
    const lines = await dohvatiLinijeZaStanicu(id);
    res.json({ station, lines });
  } catch (err) {
    console.error('GET /stanice/:id failed', err);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

router.get('/:id/linije', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const rows = await dohvatiLinijeZaStanicu(id);
    res.json(rows);
  } catch (err) {
    console.error('GET /stanice/:id/linije failed', err);
    res.status(500).json({ error: 'Failed to fetch station lines' });
  }
});

export default router;
