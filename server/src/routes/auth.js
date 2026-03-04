import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  kreirajKorisnika,
  pronadjiKorisnikaPoKorisnickomImenu
} from '../repositories/authRepo.js';

const router = express.Router();

const dozvoljeneUloge = ['obican', 'premium', 'vozac'];

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
  const uloga = String(req.body.uloga || 'obican').toLowerCase();
  const brojLicence = String(req.body.brojLicence || '').trim();

  if (korisnickoIme.length < 3) {
    return res.status(400).json({ error: 'Korisnicko ime mora imati bar 3 karaktera' });
  }

  if (lozinka.length < 6) {
    return res.status(400).json({ error: 'Lozinka mora imati bar 6 karaktera' });
  }

  if (!dozvoljeneUloge.includes(uloga)) {
    return res.status(400).json({ error: 'Nepoznata uloga korisnika' });
  }

  if (uloga === 'vozac' && brojLicence.length < 3) {
    return res.status(400).json({ error: 'Broj licence je obavezan za vozaca' });
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
      uloga,
      brojLicence: uloga === 'vozac' ? brojLicence : null
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

export default router;
