import { Hono } from 'hono'
import { MODELS } from '../config/models.js'
import { config } from '../config/env.js'

export const healthRoute = new Hono()

healthRoute.get('/health', c =>
  c.json({
    status: 'ok',
    models: MODELS,
    imagesEnabled: config.imagesEnabled,
    maxImagesPerDeck: config.maxImagesPerDeck,
  }),
)
