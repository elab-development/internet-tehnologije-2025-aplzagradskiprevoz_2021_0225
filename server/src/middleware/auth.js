import jwt from 'jsonwebtoken';

function izvuciBearerToken(authHeader) {
  if (!authHeader) return null;
  const [tip, token] = authHeader.split(' ');
  if (tip?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export function zahtevajPrijavu(req, res, next) {
  const token = izvuciBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: 'Niste prijavljeni' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.auth = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Neispravan token' });
  }
}

export function zahtevajUlogu(dozvoljeneUloge) {
  return (req, res, next) => {
    if (!req.auth?.role || !dozvoljeneUloge.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Nemate dozvolu za ovu akciju' });
    }

    return next();
  };
}
