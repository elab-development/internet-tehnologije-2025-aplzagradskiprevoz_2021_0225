import express from 'express';
import { zahtevajPrijavu, zahtevajUlogu } from '../middleware/auth.js';
import {
  dodajOmiljenuStanicu,
  dohvatiLinijeZaStanicu,
  dohvatiOmiljeneStaniceZaKorisnika,
  dohvatiStanice,
  dohvatiStanicuPoId,
  ukloniOmiljenuStanicu
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

router.get('/omiljene', zahtevajPrijavu, zahtevajUlogu(['premium']), async (req, res) => {
  try {
    const rows = await dohvatiOmiljeneStaniceZaKorisnika(req.auth.sub);
    res.json(rows);
  } catch (err) {
    console.error('GET /stanice/omiljene failed', err);
    res.status(500).json({ error: 'Failed to fetch favorite stations' });
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

router.post('/:id/omiljena', zahtevajPrijavu, zahtevajUlogu(['premium']), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const station = await dohvatiStanicuPoId(id);
    if (!station) return res.status(404).json({ error: 'Not found' });
    const result = await dodajOmiljenuStanicu(req.auth.sub, id);
    if (!result) return res.status(404).json({ error: 'Passenger profile not found' });
    return res.json({ ok: true, favorites: result.omiljenestanice || [] });
  } catch (err) {
    console.error('POST /stanice/:id/omiljena failed', err);
    return res.status(500).json({ error: 'Failed to add favorite station' });
  }
});

router.delete('/:id/omiljena', zahtevajPrijavu, zahtevajUlogu(['premium']), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const result = await ukloniOmiljenuStanicu(req.auth.sub, id);
    if (!result) return res.status(404).json({ error: 'Passenger profile not found' });
    return res.json({ ok: true, favorites: result.omiljenestanice || [] });
  } catch (err) {
    console.error('DELETE /stanice/:id/omiljena failed', err);
    return res.status(500).json({ error: 'Failed to remove favorite station' });
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
