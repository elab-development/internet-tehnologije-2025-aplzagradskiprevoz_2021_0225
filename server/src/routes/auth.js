import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { zahtevajPrijavu } from '../middleware/auth.js';
import {
  kreirajKorisnika,
  promeniLozinkuKorisnika,
  pronadjiKorisnikaPoId,
  pronadjiKorisnikaPoKorisnickomImenu
} from '../repositories/authRepo.js';

const router = express.Router();

function kreirajToken(korisnik) {
  return jwt.sign(
    {
      sub: korisnik.id,
      username: korisnik.username,
      role: korisnik.role
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  const korisnickoIme = String(req.body.korisnickoIme || '').trim();
  const lozinka = String(req.body.lozinka || '');
  const uloga = 'premium';

  if (korisnickoIme.length < 3) {
    return res.status(400).json({ error: 'Korisnicko ime mora imati bar 3 karaktera' });
  }

  if (lozinka.length < 6) {
    return res.status(400).json({ error: 'Lozinka mora imati bar 6 karaktera' });
  }

  try {
    const postojeci = await pronadjiKorisnikaPoKorisnickomImenu(korisnickoIme);
    if (postojeci) {
      return res.status(409).json({ error: 'Korisnicko ime je vec zauzeto' });
    }

    const lozinkaHash = await bcrypt.hash(lozinka, 10);
    const korisnik = await kreirajKorisnika({
      korisnickoIme,
      lozinkaHash,
      uloga
    });
    const token = kreirajToken(korisnik);

    return res.status(201).json({
      token,
      korisnik: {
        id: korisnik.id,
        korisnickoIme: korisnik.username,
        uloga: korisnik.role
      }
    });
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Podaci vec postoje u sistemu' });
    }
    return res.status(500).json({ error: 'Registracija nije uspela' });
  }
});

router.post('/login', async (req, res) => {
  const korisnickoIme = String(req.body.korisnickoIme || '').trim();
  const lozinka = String(req.body.lozinka || '');

  if (!korisnickoIme || !lozinka) {
    return res.status(400).json({ error: 'Korisnicko ime i lozinka su obavezni' });
  }

  try {
    const korisnik = await pronadjiKorisnikaPoKorisnickomImenu(korisnickoIme);
    if (!korisnik) {
      return res.status(401).json({ error: 'Pogresni kredencijali' });
    }

    const validnaLozinka = await bcrypt.compare(lozinka, korisnik.password_hash);
    if (!validnaLozinka) {
      return res.status(401).json({ error: 'Pogresni kredencijali' });
    }

    const token = kreirajToken(korisnik);
    return res.json({
      token,
      korisnik: {
        id: korisnik.id,
        korisnickoIme: korisnik.username,
        uloga: korisnik.role
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Prijava nije uspela' });
  }
});

router.post('/promeni-lozinku', zahtevajPrijavu, async (req, res) => {
  const staraLozinka = String(req.body.staraLozinka || '');
  const novaLozinka = String(req.body.novaLozinka || '');
  const potvrdaLozinke = String(req.body.potvrdaLozinke || '');

  if (!staraLozinka || !novaLozinka || !potvrdaLozinke) {
    return res.status(400).json({ error: 'Sva polja su obavezna' });
  }
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

    const validnaStara = await bcrypt.compare(staraLozinka, korisnik.password_hash);
    if (!validnaStara) {
      return res.status(401).json({ error: 'Stara lozinka nije ispravna' });
    }
    const istaKaoPrethodna = await bcrypt.compare(novaLozinka, korisnik.password_hash);
    if (istaKaoPrethodna) {
      return res.status(400).json({ error: 'Nova lozinka mora biti drugačija od prethodne' });
    }

    const novaLozinkaHash = await bcrypt.hash(novaLozinka, 10);
    await promeniLozinkuKorisnika(korisnik.id, novaLozinkaHash);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Promena lozinke nije uspela' });
  }
});

export default router;
