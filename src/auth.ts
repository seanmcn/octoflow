// A placeholder for the GitHub Client ID.
// Users will need to replace this with their own Client ID.
const GITHUB_CLIENT_ID = 'Iv1.c4a45ab326588e27'; // Replace with your GitHub OAuth App's Client ID

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const REDIRECT_URI = window.location.origin + window.location.pathname;

let accessToken: string | null = null;

// Generate a random string for the code verifier
function generateCodeVerifier(): string {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  return base64urlEncode(randomBytes);
}

// Generate the code challenge from the code verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(new Uint8Array(digest));
}

// Base64URL encode
function base64urlEncode(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Redirect the user to GitHub for authentication
export async function redirectToGitHubAuth() {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem('code_verifier', verifier);

  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'repo',
    state: 'some_random_state_string', // Should be a random string to prevent CSRF
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${GITHUB_AUTH_URL}?${params.toString()}`;
}

// Handle the callback from GitHub
export async function handleAuthCallback(): Promise<boolean> {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    const verifier = sessionStorage.getItem('code_verifier');
    if (!verifier) {
      throw new Error('Code verifier not found in session storage.');
    }

    // The token exchange needs to be done via a server to avoid exposing the client secret.
    // However, for a pure browser app, we can use a proxy or a serverless function.
    // GitHub now supports PKCE for OAuth Apps, which doesn't require a client secret for the token exchange.
    // The token endpoint requires a POST request, which can be blocked by CORS if not requested correctly.
    // We will use a CORS proxy for this if direct requests fail.
    // A better approach for pure-client apps might be the Device Flow, but let's stick with PKCE as planned.

    // The token endpoint for GitHub Apps with PKCE should support CORS.
    // We will attempt a direct call. If this fails due to CORS, we may need a simple proxy.
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code: code,
        code_verifier: verifier,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        accessToken = data.access_token;
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      }
    }
    // Clean the URL even if it fails
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return false;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function isAuthenticated(): boolean {
  return accessToken !== null;
}
