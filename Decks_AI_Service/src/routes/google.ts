import { Hono } from 'hono'
import { z } from 'zod'
import { getSession } from '../session/store.js'
import { logError } from '../lib/log.js'
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  extractSpreadsheetId,
  getValidAccessToken,
  listSheetTabs,
  importSheetTab,
  GoogleNotConfiguredError,
  GoogleAuthError,
} from '../lib/google.js'

export const googleRoute = new Hono()

// GET so the frontend can just fetch it before opening the consent popup.
googleRoute.get('/connectors/google/auth-url', c => {
  const sessionId = c.req.query('sessionId')
  if (!sessionId) return c.json({ error: 'sessionId is required' }, 400)
  if (!getSession(sessionId)) return c.json({ error: 'Session expired or not found' }, 404)

  try {
    return c.json({ url: buildAuthUrl(sessionId) })
  } catch (err) {
    if (err instanceof GoogleNotConfiguredError) return c.json({ error: err.message, code: 'NOT_CONFIGURED' }, 501)
    logError('route.google.auth-url', err)
    return c.json({ error: 'Could not start Google sign-in' }, 500)
  }
})

// The consent screen redirects here with ?code&state=sessionId. This is a
// top-level browser navigation (opened in its own tab by the frontend), not
// a fetch — so it ends with a small HTML page telling the user to return to
// the app, rather than a JSON response or a redirect into the SPA's router.
googleRoute.get('/connectors/google/callback', async c => {
  const code = c.req.query('code')
  const sessionId = c.req.query('state')
  const errorParam = c.req.query('error')

  const page = (title: string, body: string) =>
    c.html(
      `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>` +
        `<body style="font-family: -apple-system, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#0A0A0B; color:#F5F5F4;">` +
        `<div style="text-align:center; max-width:360px;"><p style="font-size:15px;">${body}</p></div></body></html>`,
    )

  if (errorParam) return page('Connection cancelled', 'Google sign-in was cancelled. You can close this tab and try again.')
  if (!code || !sessionId) return page('Something went wrong', 'Missing information from Google. Close this tab and try again.')

  const state = getSession(sessionId)
  if (!state) return page('Session expired', 'This Decks AI session has expired. Close this tab, start a new deck, and try connecting again.')

  try {
    const tokens = await exchangeCodeForTokens(code)
    state.googleTokens = tokens
    return page('Connected', 'Google account connected — you can close this tab and return to Decks AI.')
  } catch (err) {
    logError('route.google.callback', err)
    return page('Connection failed', 'Something went wrong connecting your Google account. Close this tab and try again.')
  }
})

googleRoute.get('/connectors/google/status', c => {
  const sessionId = c.req.query('sessionId')
  if (!sessionId) return c.json({ error: 'sessionId is required' }, 400)
  const state = getSession(sessionId)
  if (!state) return c.json({ error: 'Session expired or not found' }, 404)
  return c.json({ connected: Boolean(state.googleTokens) })
})

const TabsBodySchema = z.object({ sessionId: z.string().min(1), sheetUrlOrId: z.string().min(1) })

googleRoute.post('/connectors/google/sheets/tabs', async c => {
  const body = TabsBodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  if (!state) return c.json({ error: 'Session expired or not found' }, 404)

  const spreadsheetId = extractSpreadsheetId(body.data.sheetUrlOrId)
  if (!spreadsheetId) return c.json({ error: "That doesn't look like a Google Sheets link or ID" }, 400)

  try {
    const accessToken = await getValidAccessToken(state)
    const tabs = await listSheetTabs(accessToken, spreadsheetId)
    return c.json({ spreadsheetId, tabs: tabs.map(t => t.title) })
  } catch (err) {
    if (err instanceof GoogleAuthError) return c.json({ error: err.message, code: 'AUTH_REQUIRED' }, 401)
    logError('route.google.sheets.tabs', err)
    return c.json({ error: 'Could not read that spreadsheet' }, 500)
  }
})

const ImportBodySchema = z.object({ sessionId: z.string().min(1), spreadsheetId: z.string().min(1), tabName: z.string().min(1) })

// Returns the parsed dataset WITHOUT attaching it to the session — the
// frontend runs it through the same preview/column-mapping step as a
// pasted table, then calls POST /data to actually attach it. Keeps one
// single attach path for every data source, connector or not.
googleRoute.post('/connectors/google/sheets/import', async c => {
  const body = ImportBodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: 'Invalid request body', issues: body.error.issues }, 400)

  const state = getSession(body.data.sessionId)
  if (!state) return c.json({ error: 'Session expired or not found' }, 404)

  try {
    const accessToken = await getValidAccessToken(state)
    const dataset = await importSheetTab(accessToken, body.data.spreadsheetId, body.data.tabName)
    return c.json({ dataset })
  } catch (err) {
    if (err instanceof GoogleAuthError) return c.json({ error: err.message, code: 'AUTH_REQUIRED' }, 401)
    logError('route.google.sheets.import', err)
    return c.json({ error: err instanceof Error ? err.message : 'Could not import that sheet' }, 500)
  }
})
