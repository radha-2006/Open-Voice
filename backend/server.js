import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

app.use(cors({ origin: '*' }))
app.use(express.json())

// ── Auth middleware ───────────────────────────────────────────
async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid session' })
  req.user = user
  next()
}

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, app: 'OpenVoice' }))

// ── ADMIN: list my events ─────────────────────────────────────
app.get('/api/admin/events', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('events').select('*')
    .eq('owner_id', req.user.id)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ events: data })
})

// ── ADMIN: create event ───────────────────────────────────────
app.post('/api/events', requireAdmin, async (req, res) => {
  const { title, moderator_name } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title required' })
  const session_code = uuidv4().slice(0, 8).toUpperCase()
  const { data, error } = await supabase.from('events')
    .insert({ title: title.trim(), moderator_name: moderator_name || req.user.email, session_code, status: 'active', owner_id: req.user.id })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  const joinUrl = `${FRONTEND}/join/${session_code}`
  const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
  res.json({ event: data, joinUrl, qrDataUrl })
})

// ── PUBLIC: get event by code ─────────────────────────────────
app.get('/api/events/:code', async (req, res) => {
  const { data, error } = await supabase.from('events').select('*')
    .eq('session_code', req.params.code.toUpperCase())
    .eq('status', 'active').single()
  if (error || !data) return res.status(404).json({ error: 'Session not found or ended' })
  res.json({ event: data })
})

// ── ADMIN: get QR code for existing session (server-side generation) ──
app.get('/api/events/:code/qr', requireAdmin, async (req, res) => {
  const code = req.params.code.toUpperCase()
  const { data } = await supabase.from('events').select('id, status')
    .eq('session_code', code).single()
  if (!data) return res.status(404).json({ error: 'Event not found' })
  const joinUrl = `${FRONTEND}/join/${code}`
  const qrDataUrl = await QRCode.toDataURL(joinUrl, { width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
  res.json({ qrDataUrl, joinUrl })
})

// ── PUBLIC: attendee joins ────────────────────────────────────
app.post('/api/events/:code/join', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const { data: ev } = await supabase.from('events').select('id')
    .eq('session_code', req.params.code.toUpperCase()).eq('status', 'active').single()
  if (!ev) return res.status(404).json({ error: 'Session not found' })
  const { data, error } = await supabase.from('attendees')
    .insert({ event_id: ev.id, name: name.trim() }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ attendee: data })
})

// ── PUBLIC: request to speak ──────────────────────────────────
app.post('/api/queue/request', async (req, res) => {
  const { attendee_id, event_id, question_text } = req.body
  if (!attendee_id || !event_id) return res.status(400).json({ error: 'attendee_id and event_id required' })
  // Check already in queue
  const { data: existing } = await supabase.from('speaker_queue').select('id')
    .eq('attendee_id', attendee_id).in('status', ['waiting', 'approved', 'speaking']).single()
  if (existing) return res.status(409).json({ error: 'Already in queue' })
  const { data, error } = await supabase.from('speaker_queue')
    .insert({ attendee_id, event_id, status: 'waiting', question_text: question_text || null })
    .select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ queue_entry: data })
})

// ── ADMIN: get queue ──────────────────────────────────────────
app.get('/api/events/:code/queue', requireAdmin, async (req, res) => {
  const { data: ev } = await supabase.from('events').select('id')
    .eq('session_code', req.params.code.toUpperCase()).single()
  if (!ev) return res.status(404).json({ error: 'Event not found' })
  const { data, error } = await supabase.from('speaker_queue')
    .select('*, attendees(name)').eq('event_id', ev.id)
    .in('status', ['waiting', 'approved', 'speaking'])
    .order('created_at', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ queue: data })
})

// ── ADMIN: get attendee count ─────────────────────────────────
app.get('/api/events/:code/count', requireAdmin, async (req, res) => {
  const { data: ev } = await supabase.from('events').select('id')
    .eq('session_code', req.params.code.toUpperCase()).single()
  if (!ev) return res.json({ count: 0 })
  const { count } = await supabase.from('attendees')
    .select('id', { count: 'exact', head: true }).eq('event_id', ev.id)
  res.json({ count: count || 0 })
})

// ── ADMIN: approve speaker ────────────────────────────────────
app.patch('/api/queue/:id/approve', requireAdmin, async (req, res) => {
  // End any currently speaking/approved person first
  const { data: entry } = await supabase.from('speaker_queue')
    .select('event_id').eq('id', req.params.id).single()
  if (entry) {
    await supabase.from('speaker_queue')
      .update({ status: 'done', ended_at: new Date().toISOString() })
      .eq('event_id', entry.event_id)
      .in('status', ['approved', 'speaking'])
      .neq('id', req.params.id)
  }
  const { data, error } = await supabase.from('speaker_queue')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ queue_entry: data })
})

// ── ADMIN: reject / end turn ──────────────────────────────────
app.patch('/api/queue/:id/reject', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('speaker_queue')
    .update({ status: 'rejected' }).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ queue_entry: data })
})

app.patch('/api/queue/:id/end', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('speaker_queue')
    .update({ status: 'done', ended_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ queue_entry: data })
})

// ── ADMIN: end event ──────────────────────────────────────────
app.patch('/api/events/:code/end', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('events')
    .update({ status: 'ended' })
    .eq('session_code', req.params.code.toUpperCase()).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ event: data })
})

app.listen(PORT, () => {
  console.log(`\n🎙️  OpenVoice backend running on http://localhost:${PORT}`)
  console.log(`    Test: curl http://localhost:${PORT}/health\n`)
})
