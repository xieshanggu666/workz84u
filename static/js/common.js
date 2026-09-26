async function logout() {
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  window.location.href = '/login';
}

function getToken() {
  return localStorage.getItem('access_token') || '';
}
