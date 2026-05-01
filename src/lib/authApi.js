const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const GOOGLE_ACCESS_TOKEN_KEY = 'finova_google_access_token';

export function redirectToGoogleOAuth() {
  const returnTo = window.location.href;
  const url = new URL('/auth/google/login', API_BASE_URL);
  url.searchParams.set('return_to', returnTo);
  window.location.assign(url.toString());
}

export function readGoogleTokenFromRedirect() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = params.get('access_token') || params.get('token') || hashParams.get('access_token') || hashParams.get('token');
  const authStatus = params.get('auth') || hashParams.get('auth');

  if (token) {
    saveGoogleAccessToken(token);
    cleanAuthParamsFromUrl();
    return token;
  }

  if (authStatus?.startsWith('google_')) {
    cleanAuthParamsFromUrl();
  }

  return getGoogleAccessToken();
}

export async function fetchGoogleUser(accessToken = getGoogleAccessToken()) {
  if (!accessToken) return null;

  const response = await fetch(new URL('/auth/google/me', API_BASE_URL), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    clearGoogleAccessToken();
    throw new Error('Google session is invalid or expired');
  }

  return response.json();
}

export async function logoutGoogle(accessToken = getGoogleAccessToken()) {
  if (accessToken) {
    await fetch(new URL('/auth/google/logout', API_BASE_URL), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => {});
  }
  clearGoogleAccessToken();
}

export function getGoogleAccessToken() {
  return localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
}

function saveGoogleAccessToken(accessToken) {
  localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, accessToken);
}

function clearGoogleAccessToken() {
  localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
}

function cleanAuthParamsFromUrl() {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}
