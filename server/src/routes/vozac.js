import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { zahtevajPrijavu, zahtevajUlogu } from '../middleware/auth.js';
import { pronadjiKorisnikaPoId } from '../repositories/authRepo.js';
import {
  dodeliDnevnuLinijuAkoNedostaje,
  dohvatiVozacevStatusGuzve,
  promeniLozinkuVozaca,
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
      vozacId: vozac.vozac_id,
      mustChangePassword: Boolean(vozac.must_change_password)
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

router.post('/login', async (req, res) => {
  const korisnickoIme = String(req.body.korisnickoIme || '').trim();
  const lozinka = String(req.body.lozinka || '');
  if (!korisnickoIme || !lozinka) {
    return res.status(400).json({ error: 'Korisničko ime i lozinka su obavezni' });
  }

  try {
    const vozac = await pronadjiVozacaPoKorisnickomImenu(korisnickoIme);
    if (!vozac) return res.status(401).json({ error: 'Pogrešni kredencijali' });

    const validnaLozinka = await bcrypt.compare(lozinka, vozac.password_hash);
    if (!validnaLozinka) return res.status(401).json({ error: 'Pogrešni kredencijali' });

    const token = kreirajTokenZaVozaca(vozac);
    const trebaPromenuLozinke = Boolean(vozac.must_change_password);
    const dnevnaLinija = trebaPromenuLozinke
      ? null
      : await dodeliDnevnuLinijuAkoNedostaje(vozac.vozac_id);

    return res.json({
      token,
      korisnik: {
        id: vozac.user_id,
        korisnickoIme: vozac.username,
        uloga: 'vozac'
      },
      linija: dnevnaLinija,
      mustChangePassword: trebaPromenuLozinke
    });
  } catch (err) {
    return res.status(500).json({ error: 'Prijava vozača nije uspela' });
  }
});

router.get('/moja-linija', zahtevajPrijavu, zahtevajUlogu(['vozac']), async (req, res) => {
  if (req.auth.mustChangePassword) {
    return res.status(403).json({ error: 'Prvo promenite šifru.' });
  }

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
  if (req.auth.mustChangePassword) {
    return res.status(403).json({ error: 'Prvo promenite šifru.' });
  }

  const ulazniStatus = String(req.body.status || '').toLowerCase();
  const status = apiToDbStatus[ulazniStatus];
  if (!status) return res.status(400).json({ error: 'Invalid status' });

  try {
    const linija = await upisiVozacevStatusGuzve(req.auth.vozacId, status);
    if (!linija) return res.status(404).json({ error: 'Linija nije dodeljena' });
    return res.json({ ok: true, line: linija });
  } catch (err) {
    return res.status(500).json({ error: 'Neuspešan upis statusa guzve' });
  }
});

router.post('/promeni-lozinku', zahtevajPrijavu, zahtevajUlogu(['vozac']), async (req, res) => {
  const novaLozinka = String(req.body.novaLozinka || '');
  const potvrdaLozinke = String(req.body.potvrdaLozinke || '');

  if (novaLozinka.length < 6) {
    return res.status(400).json({ error: 'Lozinka mora imati bar 6 karaktera' });
  }
  if (novaLozinka !== potvrdaLozinke) {
    return res.status(400).json({ error: 'Lozinke se ne poklapaju' });
  }

  try {
    const korisnik = await pronadjiKorisnikaPoId(req.auth.sub);
    if (!korisnik) {
      return res.status(404).json({ error: 'Korisnik nije pronađen' });
    }
    const istaKaoPrethodna = await bcrypt.compare(novaLozinka, korisnik.password_hash);
    if (istaKaoPrethodna) {
      return res.status(400).json({ error: 'Nova lozinka mora biti drugačija od prethodne' });
    }

    const novaLozinkaHash = await bcrypt.hash(novaLozinka, 10);
    await promeniLozinkuVozaca({
      userId: req.auth.sub,
      vozacId: req.auth.vozacId,
      novaLozinkaHash
    });

    const token = jwt.sign(
      {
        sub: req.auth.sub,
        username: req.auth.username,
        role: 'vozac',
        vozacId: req.auth.vozacId,
        mustChangePassword: false
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    return res.json({
      ok: true,
      token,
      mustChangePassword: false
    });
  } catch (err) {
    return res.status(500).json({ error: 'Promena lozinke nije uspela' });
  }
});

export default router;
