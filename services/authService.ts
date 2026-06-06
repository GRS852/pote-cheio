const API_URL = 'https://api.potecheio.site';

export type Usuario = {
  id: number;
  email: string;
  full_name: string;
  birth_date: string | null;
  created_at: string;
  phone: string | null;
  cpf: string | null;
};

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
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401 || response.status === 403) throw new AuthError();
  if (!response.ok) throw new NetworkError(`Erro no servidor (${response.status}).`);

  return response.json();
}

export async function signUpRequest(
  full_name: string,
  email: string,
  password: string,
  birth_date: string
) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password, birth_date }),
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401 || response.status === 403) throw new AuthError();
  if (response.status === 409) throw new ConflictError();

  if (response.status === 400) {
    let msg = 'Dados inválidos. Verifique as informações e tente novamente.';
    try {
      const body = await response.json();
      if (body?.message) msg = body.message;
    } catch {}
    throw new ValidationError(msg);
  }

  if (!response.ok) throw new NetworkError(`Erro no servidor (${response.status}).`);

  return response.json();
}

export async function getMeRequest(token: string): Promise<Usuario> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) throw new NetworkError();

  const data = await response.json();
  return data.user as Usuario;
}
