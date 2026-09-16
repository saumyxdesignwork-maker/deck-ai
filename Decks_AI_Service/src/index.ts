import { serve } from '@hono/node-server'
import { app } from './app.js'
import { config } from './config/env.js'
import { log } from './lib/log.js'

serve({ fetch: app.fetch, port: config.port }, info => {
  log('server', `Decks AI Service listening on http://localhost:${info.port}`)
})
