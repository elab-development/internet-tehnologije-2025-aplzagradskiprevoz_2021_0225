import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { zahtevajPrijavu, zahtevajUlogu } from '../middleware/auth.js';
import {
  dodeliDnevnuLinijuAkoNedostaje,
  dohvatiVozacevStatusGuzve,
  pronadjiVozacaPoKorisnickomImenu,
  upisiVozacevStatusGuzve
} from '../repositories/vozacRepo.js';

const router = express.Router();

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

const dbToApiStatus = {
  none: 'nema',
  low: 'mala',
  medium: 'srednja',
  high: 'velika',
  unknown: 'nepoznato'
};

function kreirajTokenZaVozaca(vozac) {
  return jwt.sign(
    {
      sub: vozac.user_id,
      username: vozac.username,
      role: 'vozac',
      vozacId: vozac.vozac_id
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

router.post('/login', async (req, res) => {
  const korisnickoIme = String(req.body.korisnickoIme || '').trim();
  const lozinka = String(req.body.lozinka || '');
  if (!korisnickoIme || !lozinka) {
    return res.status(400).json({ error: 'Korisnicko ime i lozinka su obavezni' });
  }

  try {
    const vozac = await pronadjiVozacaPoKorisnickomImenu(korisnickoIme);
    if (!vozac) return res.status(401).json({ error: 'Pogresni kredencijali' });

    const validnaLozinka = await bcrypt.compare(lozinka, vozac.password_hash);
    if (!validnaLozinka) return res.status(401).json({ error: 'Pogresni kredencijali' });

    const token = kreirajTokenZaVozaca(vozac);
    const dnevnaLinija = await dodeliDnevnuLinijuAkoNedostaje(vozac.vozac_id);

    return res.json({
      token,
      korisnik: {
        id: vozac.user_id,
        korisnickoIme: vozac.username,
        uloga: 'vozac'
      },
      linija: dnevnaLinija
    });
  } catch (err) {
    return res.status(500).json({ error: 'Prijava vozaca nije uspela' });
  }
});

router.get('/moja-linija', zahtevajPrijavu, zahtevajUlogu(['vozac']), async (req, res) => {
  try {
    const stanje = await dohvatiVozacevStatusGuzve(req.auth.vozacId);
    if (!stanje) return res.status(404).json({ error: 'Linija nije dodeljena' });
    return res.json({
      line: stanje.line,
      status: dbToApiStatus[stanje.status] || 'nepoznato'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Neuspesno dohvatanje linije vozaca' });
  }
});

router.post('/moja-linija/guzva', zahtevajPrijavu, zahtevajUlogu(['vozac']), async (req, res) => {
  const ulazniStatus = String(req.body.status || '').toLowerCase();
  const status = apiToDbStatus[ulazniStatus];
  if (!status) return res.status(400).json({ error: 'Invalid status' });

  try {
    const linija = await upisiVozacevStatusGuzve(req.auth.vozacId, status);
    if (!linija) return res.status(404).json({ error: 'Linija nije dodeljena' });
    return res.json({ ok: true, line: linija });
  } catch (err) {
    return res.status(500).json({ error: 'Neuspesan upis statusa guzve' });
  }
});

export default router;
