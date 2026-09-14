-- Run in Supabase SQL Editor → New Query → Run All

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  moderator_name text not null,
  session_code  text unique not null,
  status        text not null default 'active' check (status in ('active','ended')),
  owner_id      uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

create table if not exists public.attendees (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid references public.events(id) on delete cascade,
  name      text not null,
  joined_at timestamptz default now()
);

create table if not exists public.speaker_queue (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events(id) on delete cascade,
  attendee_id   uuid references public.attendees(id) on delete cascade,
  status        text not null default 'waiting'
                check (status in ('waiting','approved','speaking','done','rejected')),
  question_text text,
  approved_at   timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz default now()
);

-- WebRTC signaling table — phone and host laptop exchange SDP/ICE through this
create table if not exists public.rtc_signals (
  id         uuid primary key default gen_random_uuid(),
  session_code text not null,
  from_peer  text not null,
  to_peer    text not null,
  type       text not null,   -- 'offer' | 'answer' | 'ice'
  payload    jsonb not null,
  created_at timestamptz default now()
);

-- Auto-cleanup old signals after 10 minutes
create index if not exists idx_rtc_session on public.rtc_signals(session_code);
create index if not exists idx_queue_event  on public.speaker_queue(event_id);
create index if not exists idx_queue_status on public.speaker_queue(status);
create index if not exists idx_attendees_ev on public.attendees(event_id);
create index if not exists idx_events_code  on public.events(session_code);

alter table public.events        enable row level security;
alter table public.attendees     enable row level security;
alter table public.speaker_queue enable row level security;
alter table public.rtc_signals   enable row level security;

-- Allow all via service key (backend uses service key, bypasses RLS)
create policy "svc_events"  on public.events        for all using (true) with check (true);
create policy "svc_att"     on public.attendees     for all using (true) with check (true);
create policy "svc_queue"   on public.speaker_queue for all using (true) with check (true);
create policy "svc_rtc"     on public.rtc_signals   for all using (true) with check (true);

-- Enable real-time (CRITICAL — without this the live queue won't update)
alter publication supabase_realtime add table public.speaker_queue;
alter publication supabase_realtime add table public.attendees;
alter publication supabase_realtime add table public.rtc_signals;
