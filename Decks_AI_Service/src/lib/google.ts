import { config } from '../config/env.js'
import { logError } from './log.js'
import type { SessionState } from '../session/store.js'
import type { DeckDataset } from '../contract/data.js'

// Read-only scope only — least privilege, matches the "consented,
// least-privilege connection" requirement (no write access, no Drive-wide
// access, just spreadsheet contents).
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'

export class GoogleNotConfiguredError extends Error {
  constructor() {
    super('Google Sheets connector is not configured on this server')
    this.name = 'GoogleNotConfiguredError'
  }
}

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleAuthError'
  }
}

function requireConfigured() {
  if (!config.google.configured || !config.google.clientId || !config.google.clientSecret) {
    throw new GoogleNotConfiguredError()
  }
}

/** Builds the consent-screen URL the user is redirected to. `state` carries
 * our sessionId through the round trip so the callback knows which session
 * to attach tokens to. */
export function buildAuthUrl(state: string): string {
  requireConfigured()
  const params = new URLSearchParams({
    client_id: config.google.clientId!,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: SHEETS_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  error?: string
  error_description?: string
}

/** Exchanges an authorization code (from the OAuth callback) for tokens. */
export async function exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: number }> {
  requireConfigured()
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId!,
      client_secret: config.google.clientSecret!,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const json = (await res.json()) as TokenResponse
  if (!res.ok || json.error) {
    throw new GoogleAuthError(json.error_description ?? json.error ?? 'Token exchange failed')
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  requireConfigured()
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.google.clientId!,
      client_secret: config.google.clientSecret!,
      grant_type: 'refresh_token',
    }),
  })
  const json = (await res.json()) as TokenResponse
  if (!res.ok || json.error) {
    throw new GoogleAuthError(json.error_description ?? json.error ?? 'Token refresh failed')
  }
  return { accessToken: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
}

/** Returns a valid access token for this session, refreshing it first if
 * it's expired or about to be. Throws GoogleAuthError if there's nothing to
 * refresh with (caller should tell the user to reconnect). */
export async function getValidAccessToken(state: SessionState): Promise<string> {
  const tokens = state.googleTokens
  if (!tokens) throw new GoogleAuthError('Google account not connected for this session')

  const ABOUT_TO_EXPIRE_MS = 60_000
  if (tokens.expiresAt - Date.now() > ABOUT_TO_EXPIRE_MS) return tokens.accessToken

  if (!tokens.refreshToken) throw new GoogleAuthError('Google connection expired — please reconnect')
  const refreshed = await refreshAccessToken(tokens.refreshToken)
  state.googleTokens = { accessToken: refreshed.accessToken, refreshToken: tokens.refreshToken, expiresAt: refreshed.expiresAt }
  return refreshed.accessToken
}

/** Accepts either a raw spreadsheet ID or a full Google Sheets URL. */
export function extractSpreadsheetId(input: string): string | null {
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (urlMatch) return urlMatch[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim()
  return null
}

export interface SheetTab {
  title: string
}

/** Lists the tab (sheet) names within a spreadsheet. */
export async function listSheetTabs(accessToken: string, spreadsheetId: string): Promise<SheetTab[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    logError('google.listSheetTabs', new Error(`${res.status} ${body}`))
    if (res.status === 401 || res.status === 403) throw new GoogleAuthError('Access to this spreadsheet was denied — check sharing or reconnect your account')
    if (res.status === 404) throw new GoogleAuthError('Spreadsheet not found — check the link')
    throw new Error(`Google Sheets API error (${res.status})`)
  }
  const json = (await res.json()) as { sheets?: { properties?: { title?: string } }[] }
  return (json.sheets ?? []).map(s => ({ title: s.properties?.title ?? 'Untitled' }))
}

const MAX_ROWS = 50

/** Fetches a tab's values and shapes them into a DeckDataset — the first
 * row is treated as column headers, the rest as rows, capped to MAX_ROWS
 * with a truncation note so we never dump an entire sheet into a prompt. */
export async function importSheetTab(accessToken: string, spreadsheetId: string, tabName: string): Promise<DeckDataset> {
  const range = encodeURIComponent(tabName)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?majorDimension=ROWS`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    logError('google.importSheetTab', new Error(`${res.status} ${body}`))
    if (res.status === 401 || res.status === 403) throw new GoogleAuthError('Access to this spreadsheet was denied — check sharing or reconnect your account')
    throw new Error(`Google Sheets API error (${res.status})`)
  }
  const json = (await res.json()) as { values?: string[][] }
  const values = json.values ?? []
  if (!values.length) throw new Error(`"${tabName}" appears to be empty`)

  const [header, ...dataRows] = values
  const columnNames = header.map((h, i) => h?.trim() || `Column ${i + 1}`)
  const truncated = dataRows.length > MAX_ROWS
  const capped = dataRows.slice(0, MAX_ROWS)

  return {
    source: `Google Sheet — ${tabName}${truncated ? ` (first ${MAX_ROWS} rows)` : ''}`,
    capturedAt: new Date().toISOString(),
    columns: columnNames.map((name, i) => ({ name, role: i === 0 ? 'label' : 'value' })),
    rows: capped.map(row => Object.fromEntries(columnNames.map((name, i) => [name, row[i] ?? '']))),
  }
}
