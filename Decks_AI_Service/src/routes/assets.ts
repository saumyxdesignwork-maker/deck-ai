import { Hono } from 'hono'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.resolve(__dirname, '..', '..', 'assets')

const MEDIA_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

export const assetsRoute = new Hono()

assetsRoute.get('/assets/:file', async c => {
  const file = c.req.param('file')

  // Path-sanitize: only a bare filename (no slashes, no traversal) may be served.
  if (!file || file.includes('/') || file.includes('\\') || file.includes('..')) {
    return c.text('Not found', 404)
  }

  const ext = path.extname(file).slice(1).toLowerCase()
  const mediaType = MEDIA_TYPES[ext]
  if (!mediaType) return c.text('Not found', 404)

  const fullPath = path.join(ASSETS_DIR, file)
  // Defense in depth: resolved path must stay inside the assets dir.
  if (!fullPath.startsWith(ASSETS_DIR + path.sep)) return c.text('Not found', 404)

  try {
    const bytes = await readFile(fullPath)
    return c.body(new Uint8Array(bytes), 200, {
      'Content-Type': mediaType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
  } catch {
    return c.text('Not found', 404)
  }
})
