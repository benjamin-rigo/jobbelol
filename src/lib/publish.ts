const REPO = 'benjamin-rigo/jobbelol'
const BRANCH = 'main'
const API = `https://api.github.com/repos/${REPO}/contents`

export const ACTIONS_URL = `https://github.com/${REPO}/actions`

type Put = { path: string; base64: string; message: string }

async function request(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...init?.headers },
  })
  if (res.status === 404 && !init?.method) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`GitHub ${res.status}: ${body.message ?? res.statusText}`)
  }
  return res.json()
}

async function put(token: string, { path, base64, message }: Put) {
  const existing = await request(token, `${path}?ref=${BRANCH}`)
  if (existing?.content?.replace(/\n/g, '') === base64) return
  await request(token, path, {
    method: 'PUT',
    body: JSON.stringify({ message, content: base64, branch: BRANCH, sha: existing?.sha }),
  })
}

const utf8Base64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)))

async function sha1(text: string) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12)
}

// Uploaded textures are data URLs; they are committed as files so theme.css can reference them by path.
export async function uploadTexture(token: string, dataUrl: string) {
  const name = `textures/egyedi-${await sha1(dataUrl)}.jpg`
  await put(token, { path: `public/${name}`, base64: dataUrl.split(',')[1], message: `feat: add texture ${name} from designer` })
  return name
}

export async function publishTheme(token: string, css: string) {
  await put(token, { path: 'public/theme.css', base64: utf8Base64(css), message: 'style: publish theme from designer' })
}
