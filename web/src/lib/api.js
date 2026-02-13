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
  const res = await fetch(`${baseUrl}/linije/${id}/shape${qs}`);
  return res.json();
}

export async function dohvatiStatusGuzve(id) {
  const res = await fetch(`${baseUrl}/linije/${id}/crowd`);
  return res.json();
}
