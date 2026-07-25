export interface ApiError {
  code: string;
  message: string;
}

export interface RegisterResult {
  id: string;
  email: string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function parseErrorResponse(response: Response): Promise<ApiError> {
  if (response.status === 429) {
    return { code: 'rate_limited', message: 'Too many attempts. Please try again shortly.' };
  }
  try {
    const body = await response.json();
    if (body?.detail && typeof body.detail === 'object' && !Array.isArray(body.detail)) {
      return {
        code: body.detail.code ?? 'unknown_error',
        message: body.detail.message ?? 'Something went wrong. Please try again.',
      };
    }
    if (Array.isArray(body?.detail) && body.detail.length > 0) {
      return { code: 'validation_error', message: body.detail[0].msg ?? 'Invalid input.' };
    }
  } catch {
    // fall through to the generic message below
  }
  return { code: 'unknown_error', message: 'Something went wrong. Please try again.' };
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    const networkError: ApiError = {
      code: 'network_error',
      message: 'Could not reach the server. Please check your connection.',
    };
    throw networkError;
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json() as Promise<T>;
}

export async function register(email: string, password: string): Promise<RegisterResult> {
  return postJson('/auth/register', { email, password });
}

export async function login(email: string, password: string): Promise<TokenResult> {
  const result = await postJson<{ access_token: string; refresh_token: string }>('/auth/login', {
    email,
    password,
  });
  return { accessToken: result.access_token, refreshToken: result.refresh_token };
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return postJson('/auth/password-reset/request', { email });
}
