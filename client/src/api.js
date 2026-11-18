// All the calls to our Express backend live here.

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export function getFeed() {
  return request('/feed');
}

export function sendSwipe(profileId, action) {
  return request('/swipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, action }),
  });
}

export function getMatches() {
  return request('/matches');
}

export function resetDemo() {
  return request('/reset', { method: 'POST' });
}
