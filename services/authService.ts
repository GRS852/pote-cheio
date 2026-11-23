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
  // LGPD: true quando a pessoa ainda não aceitou a versão atual dos termos
  terms_pending?: boolean;
  // false nas contas criadas pelo Google (sem senha)
  has_password?: boolean;
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

export class AccountDisabledError extends Error {
  constructor(message = 'Esta conta foi desativada.') {
    super(message);
    this.name = 'AccountDisabledError';
  }
}

export class AccountBannedError extends Error {
  bannedUntil: string;
  constructor(bannedUntil: string) {
    super('Esta conta está temporariamente banida.');
    this.name = 'AccountBannedError';
    this.bannedUntil = bannedUntil;
  }
}

// Conta criada pelo Google, ainda sem senha: tem que entrar pelo botão do Google
export class GoogleAccountError extends Error {
  constructor() {
    super('Esta conta foi criada com o Google. Use o botão "Entrar com Google" ou crie uma senha em "Esqueci minha senha".');
    this.name = 'GoogleAccountError';
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

// Login com Google de quem ainda não tem conta: o app pede o aceite dos
// termos e a data de nascimento e reenvia o mesmo token
export class TermsRequiredError extends Error {
  constructor() {
    super('É preciso aceitar os termos para criar a conta.');
    this.name = 'TermsRequiredError';
  }
}

// Erros de cadastro devolvidos pela API (400) em texto para a pessoa
const SIGNUP_ERRORS: Record<string, string> = {
  'Terms not accepted': 'É preciso aceitar os Termos de Uso e a Política de Privacidade.',
  'Invalid birth date': 'Informe uma data de nascimento válida.',
  Underage: 'É preciso ter 18 anos ou mais para usar o Pote Cheio.',
};

async function signupValidationError(response: Response): Promise<ValidationError> {
  const body = await response.json().catch(() => ({}));
  return new ValidationError(
    SIGNUP_ERRORS[body?.error] ?? body?.message ?? 'Dados inválidos. Verifique as informações e tente novamente.'
  );
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

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body?.error === 'Account disabled') throw new AccountDisabledError();
    if (body?.error === 'Account temporarily banned') throw new AccountBannedError(body.banned_until);
    throw new AuthError();
  }
  if (response.status === 401) {
    const body = await response.json().catch(() => ({}));
    if (body?.error === 'Google account') throw new GoogleAccountError();
    throw new AuthError();
  }
  if (!response.ok) throw new NetworkError(`Erro no servidor (${response.status}).`);

  return response.json();
}

export async function signUpRequest(
  full_name: string,
  email: string,
  password: string,
  birth_date: string,
  accepted_terms: boolean
) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password, birth_date, accepted_terms }),
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401 || response.status === 403) throw new AuthError();
  if (response.status === 409) throw new ConflictError();

  if (response.status === 400) throw await signupValidationError(response);

  if (!response.ok) throw new NetworkError(`Erro no servidor (${response.status}).`);

  return response.json();
}

export async function googleSignInRequest(
  idToken: string,
  consent?: { accepted_terms: boolean; birth_date: string }
) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken, ...consent }),
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body?.error === 'Account disabled') throw new AccountDisabledError();
    if (body?.error === 'Account temporarily banned') throw new AccountBannedError(body.banned_until);
  }
  if (response.status === 428) throw new TermsRequiredError();
  if (response.status === 400) throw await signupValidationError(response);
  if (response.status === 401 || response.status === 403) throw new AuthError('Não foi possível validar sua conta Google.');
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
  token: string | null,
  userId: number
): Promise<Pick<Usuario, 'id' | 'full_name' | 'avatar_url'> | null> {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.user ?? null;
  } catch {
    return null;
  }
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

  // Conta desativada ou banida depois do login: a API diz o motivo
  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (body?.error === 'Account disabled') throw new AccountDisabledError();
    if (body?.error === 'Account temporarily banned') throw new AccountBannedError(body.banned_until);
    throw new AuthError();
  }
  if (response.status === 401) throw new AuthError();
  if (!response.ok) throw new NetworkError();

  const data = await response.json();
  return data.user as Usuario;
}

export async function acceptTermsRequest(token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/accept-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accepted_terms: true }),
    });
  } catch {
    throw new NetworkError();
  }
  if (!response.ok) throw new NetworkError(`Erro ao registrar o aceite (${response.status}).`);
}

// Exclui a própria conta. Quem tem senha confirma com a senha; quem entra só
// pelo Google digita EXCLUIR.
export async function deleteAccountRequest(
  token: string,
  confirmation: { password?: string; confirmation?: string }
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/me`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(confirmation),
    });
  } catch {
    throw new NetworkError();
  }
  if (response.status === 401) {
    const body = await response.json().catch(() => ({}));
    if (body?.error === 'Invalid password') throw new AuthError('Senha incorreta.');
    throw new AuthError('Sua sessão expirou. Entre novamente para excluir a conta.');
  }
  if (response.status === 400) throw new ValidationError('Digite EXCLUIR para confirmar.');
  if (!response.ok) throw new NetworkError(`Erro ao excluir a conta (${response.status}).`);
}
