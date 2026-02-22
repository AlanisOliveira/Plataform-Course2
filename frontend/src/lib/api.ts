/**
 * Wrapper para fetch() com credentials: 'include' para enviar cookies de sessão.
 * Redireciona para /login em caso de 401.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  });

  if (response.status === 401) {
    // Não redirecionar se já estiver na página de login ou em rotas de auth
    const url = typeof input === 'string' ? input : input.toString();
    if (!url.includes('/api/auth/')) {
      window.location.href = '/login';
    }
  }

  return response;
}
