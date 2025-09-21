export function saveSession({ token, user }) {
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
}
export function clearSession() {
localStorage.removeItem('token');
localStorage.removeItem('user');
}
export function getToken() {
return localStorage.getItem('token');
}
export function getUser() {
const raw = localStorage.getItem('user');
return raw ? JSON.parse(raw) : null;
}