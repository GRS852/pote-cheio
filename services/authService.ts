const API_URL = 'https://api.potecheio.site';

export class NetworkError extends Error {
  constructor(message = 'Falha de conexão com o servidor.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Credenciais inválidas') {
    super(message);
    this.name = 'AuthError';
  }
}

export async function signInRequest(email: string, password: string) {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    // fetch lança TypeError quando há falha de rede (CORS, servidor off, sem internet)
    throw new NetworkError();
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (!response.ok) {
    throw new NetworkError(`Erro no servidor (${response.status}). Tente novamente mais tarde.`);
  }

  const data = await response.json();
  return data; // espera { token: string, user: {...} }
}
