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

export async function dohvatiStatusGuzve(id) {
  const res = await fetch(`${baseUrl}/linije/${id}/guzva`);
  return res.json();
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

export async function postaviStatusGuzve(id, status, token) {
  const res = await fetch(`${baseUrl}/linije/${id}/guzva`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Upis statusa nije uspeo');
  }

  return data;
}
