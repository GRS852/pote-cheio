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

export class ConflictError extends Error {
  constructor(message = 'Email já cadastrado') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message = 'Dados inválidos') {
    super(message);
    this.name = 'ValidationError';
  }
}

export async function signInRequest(email: string, password: string) {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha: password }),
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

  // Log temporário para diagnóstico — remover após confirmar o campo correto
  console.log('[Auth] Resposta da API:', JSON.stringify(data));

  return data; // espera { token: string, user: {...} }
}

export async function signUpRequest(name: string, email: string, password: string, birthDate: string) {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, senha: password, birthDate }),
    });
  } catch {
    // fetch lança TypeError quando há falha de rede (CORS, servidor off, sem internet)
    throw new NetworkError();
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthError();
  }

  if (response.status === 409) {
    throw new ConflictError();
  }

  if (response.status === 400) {
    let msg = 'Dados inválidos. Verifique as informações e tente novamente.';
    try {
      const body = await response.json();
      if (body?.message) msg = body.message;
    } catch {}
    throw new ValidationError(msg);
  }

  if (!response.ok) {
    throw new NetworkError(`Erro no servidor (${response.status}). Tente novamente mais tarde.`);
  }

  const data = await response.json();

  console.log('[Auth] Resposta da API register:', JSON.stringify(data));

  return data;
}
