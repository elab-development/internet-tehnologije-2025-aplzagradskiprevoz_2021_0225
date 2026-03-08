const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function dohvatiStanice(query) {
  const url = query
    ? `${baseUrl}/stanice?query=${encodeURIComponent(query)}`
    : `${baseUrl}/stanice`;
  const res = await fetch(url);
  return res.json();
}

export async function dohvatiStanicu(id) {
  const res = await fetch(`${baseUrl}/stanice/${id}`);
  return res.json();
}

export async function dohvatiTrasuLinije(id, stationId) {
  const brojStanice = Number(stationId);
  const qs = Number.isFinite(brojStanice) && brojStanice > 0
    ? `?stationId=${encodeURIComponent(brojStanice)}`
    : '';
  const res = await fetch(`${baseUrl}/linije/${id}/trasa${qs}`);
  return res.json();
}

export async function dohvatiOmiljeneStanice(token) {
  const res = await fetch(`${baseUrl}/stanice/omiljene`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Neuspesno dohvatanje omiljenih stanica');
  }
  return data;
}

export async function dodajOmiljenuStanicu(id, token) {
  const res = await fetch(`${baseUrl}/stanice/${id}/omiljena`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Neuspesno dodavanje omiljene stanice');
  }
  return data;
}

export async function ukloniOmiljenuStanicu(id, token) {
  const res = await fetch(`${baseUrl}/stanice/${id}/omiljena`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Neuspesno uklanjanje omiljene stanice');
  }
  return data;
}

export async function dohvatiStatusGuzve(id, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${baseUrl}/linije/${id}/guzva`, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Neuspesno dohvatanje statusa guzve');
  }
  return data;
}

export async function registrujKorisnika(payload) {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registracija nije uspela');
  }

  return data;
}

export async function prijaviKorisnika(payload) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Prijava nije uspela');
  }

  return data;
}

export async function prijaviVozaca(payload) {
  const res = await fetch(`${baseUrl}/vozac/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Prijava vozaca nije uspela');
  }

  return data;
}

export async function dohvatiVozacevuLiniju(token) {
  const res = await fetch(`${baseUrl}/vozac/moja-linija`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Neuspesno dohvatanje linije vozaca');
  }
  return data;
}

export async function upisiVozacevuGuzvu(status, token) {
  const res = await fetch(`${baseUrl}/vozac/moja-linija/guzva`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Neuspesan upis statusa guzve');
  }
  return data;
}

export async function promeniVozacevuLozinku(payload, token) {
  const res = await fetch(`${baseUrl}/vozac/promeni-lozinku`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Promena lozinke nije uspela');
  }
  return data;
}
