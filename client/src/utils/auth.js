export function saveSession({ token, user }) {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');

  // optional cleanup of old data if localStorage was used earlier
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken() {
  return sessionStorage.getItem('token');
}

export function getUser() {
  const raw = sessionStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}