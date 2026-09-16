import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config/env.js'
import { logError } from './lib/log.js'
import { healthRoute } from './routes/health.js'
import { generateRoute } from './routes/generate.js'
import { clarifyRoute } from './routes/clarify.js'
import { approveRoute } from './routes/approve.js'
import { regenerateRoute } from './routes/regenerate.js'
import { followupRoute } from './routes/followup.js'
import { assetsRoute } from './routes/assets.js'

export const app = new Hono()

// CORS must run before routes. The frontend origin is configurable via
// CORS_ORIGIN — never wildcard here since streaming responses carry
// generated content, not because of secrecy (the key never leaves the server).
app.use(
  '*',
  cors({
    origin: config.corsOrigin,
    allowMethods: ['GET', 'POST'],
  }),
)

app.route('/', healthRoute)
app.route('/', generateRoute)
app.route('/', clarifyRoute)
app.route('/', approveRoute)
app.route('/', regenerateRoute)
app.route('/', followupRoute)
app.route('/', assetsRoute)

app.onError((err, c) => {
  logError('app', err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.notFound(c => c.json({ error: 'Not found' }, 404))
