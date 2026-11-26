const UA = "profile-readme-generator";

export function token(): string | undefined {
  return process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN || undefined;
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 20_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, headers: { "user-agent": UA, ...(init.headers ?? {}) } });
  } finally {
    clearTimeout(timer);
  }
}

export async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetchWithTimeout(url, { headers: { accept: "application/json", ...headers } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as T;
}

export function githubHeaders(): Record<string, string> {
  const t = token();
  return {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(t ? { authorization: `Bearer ${t}` } : {}),
  };
}

export async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const t = token();
  if (!t) throw new Error("no GitHub token for GraphQL");
  const res = await fetchWithTimeout("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${t}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || body.errors?.length || !body.data) {
    throw new Error(`GraphQL failed (${res.status}): ${body.errors?.map((e) => e.message).join("; ") ?? "no data"}`);
  }
  return body.data;
}

/** Run a promise, returning `fallback` (and logging) on failure. */
export async function soft<T>(what: string, p: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await p();
  } catch (e) {
    console.warn(`⚠ ${what}: ${(e as Error).message}`);
    return fallback;
  }
}
