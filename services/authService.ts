const API_URL = 'https://api.potecheio.site';

export type Usuario = {
  id: number;
  email: string;
  full_name: string;
  birth_date: string | null;
  created_at: string;
  phone: string | null;
  cpf: string | null;
  avatar_url?: string | null;
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

export async function updateProfileRequest(
  token: string,
  payload: { avatar_url?: string | null; full_name?: string }
): Promise<Usuario> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new NetworkError();
  }
  if (!response.ok) throw new NetworkError(`Erro ao atualizar perfil (${response.status})`);
  const data = await response.json();
  return data.user as Usuario;
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new NetworkError();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? `Erro ao enviar código (${response.status})`);
  }
}

export async function verifyResetCodeRequest(email: string, code: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
  } catch {
    throw new NetworkError();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? 'Código inválido ou expirado.');
  }
}

export async function resetPasswordRequest(
  email: string,
  code: string,
  new_password: string
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password }),
    });
  } catch {
    throw new NetworkError();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message ?? 'Não foi possível redefinir a senha.');
  }
}

export async function getUserByIdRequest(
  token: string,
  userId: number
): Promise<Pick<Usuario, 'id' | 'full_name' | 'avatar_url'> | null> {
  const endpoints = [
    `/users/${userId}`,
    `/auth/users/${userId}`,
    `/profile/${userId}`,
    `/auth/profile/${userId}`,
  ];

  for (const path of endpoints) {
    try {
      const response = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) continue;
      const data = await response.json();
      const u = data.user ?? data.profile ?? data;
      if (!u || (!u.full_name && !u.name)) continue;
      return {
        id: u.id ?? userId,
        full_name: u.full_name ?? u.name ?? '',
        avatar_url: u.avatar_url ?? u.photo_url ?? null,
      };
    } catch {
      continue;
    }
  }
  return null;
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
