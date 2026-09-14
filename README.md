# OpenVoice — Live Event Q&A Platform

Transform every attendee's smartphone into a live networked microphone.
Attendees scan a QR code, tap to speak, and their voice streams via WebRTC
through your laptop → DI box → venue mixer → PA speakers.

---

## PART 1 — LOCAL SETUP (build and test first)

### What you need before starting
- Node.js 18 or higher installed (download from nodejs.org)
- A free Supabase account (supabase.com)
- Google Chrome (required for hardware audio routing)
- Two PowerShell windows open side by side

---

### Step 1 — Create your Supabase project

1. Go to https://supabase.com → Sign up free → New project
2. Name: `openvoice`   Password: choose a strong one   Region: Mumbai (ap-south-1)
3. Wait about 2 minutes for it to provision
4. Go to **SQL Editor** → click **New query**
5. Open the file `backend/supabase_schema.sql`, copy everything, paste it into the editor, click **Run**
6. You should see "Success. No rows returned" for each statement
7. Go to **Project Settings** → **API** and copy these three values:
   - Project URL       → this is your `SUPABASE_URL`
   - anon public key   → this is your `VITE_SUPABASE_ANON_KEY`
   - service_role key  → this is your `SUPABASE_SERVICE_KEY` (keep this secret)
8. Go to **Authentication** → **URL Configuration**
   - Add `http://localhost:5173` to Redirect URLs
   - Set Site URL to `http://localhost:5173`

---

### Step 2 — Set up the backend (PowerShell window 1)

```powershell
# Navigate into the backend folder
cd C:\Users\radha\Downloads\openvoice\backend

# Create your env file from the example
copy .env.example .env

# Open it in Notepad and fill in your values
notepad .env
```

Your `.env` should look like this when filled:
```
SUPABASE_URL=https://abcdefghijkl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

```powershell
# Install dependencies
npm install

# Start the backend (leave this window running)
npm run dev
```

You should see:
```
🎙️  OpenVoice backend running on http://localhost:3001
    Test: curl http://localhost:3001/health
```

Test it works — open a browser and go to http://localhost:3001/health
You should see: `{"ok":true,"app":"OpenVoice"}`

---

### Step 3 — Set up the frontend (PowerShell window 2)

```powershell
cd C:\Users\radha\Downloads\openvoice\frontend

copy .env.example .env
notepad .env
```

Fill it in:
```
VITE_SUPABASE_URL=https://abcdefghijkl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001
```

```powershell
npm install
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 500ms
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in Chrome.

---

### Step 4 — Create your first admin account

1. On the landing page, click **Admin / Moderator**
2. Click **Create account**
3. Enter your name, email, and a password
4. Check your email — click the confirmation link
5. Return to the app and sign in
6. You are now on the Admin Dashboard

---

### Step 5 — Test the full flow locally

1. **Admin:** Click **New event** → type a title → click **Create**
2. A QR code appears — this is what attendees scan
3. Click **Open moderator panel**
4. **Also open** the "Audio host (DI box)" link in a new Chrome tab — this is the page that receives the audio
5. **On your phone:** Open the join URL shown on the QR modal (or scan the QR)
6. Enter your name → Join
7. Tap **Request to speak**
8. **Admin:** You see the queue update live. Click **Approve**
9. **On phone:** Mic permission prompt appears. Tap Allow
10. Speak — you should hear your voice through your laptop speakers (or DI box if connected)

---

## PART 2 — DEPLOYMENT (production, live events)

### Overview of what you're deploying

```
GitHub repository
    ├── /backend  → Railway (Node.js server)   free tier
    └── /frontend → Vercel  (React app)         free tier
                    (both connect to Supabase)
```

---

### Step 1 — Push to GitHub

1. Go to https://github.com → Sign in → click **+** → **New repository**
2. Name: `openvoice` → keep it public → click **Create repository**
3. In PowerShell (from the root `openvoice` folder):

```powershell
# Navigate to the root of the project (one level above backend and frontend)
cd C:\Users\radha\Downloads\openvoice

git init
git add .
git commit -m "Initial OpenVoice commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/openvoice.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

### Step 2 — Deploy backend to Railway

1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `openvoice` repository
4. Railway will ask for the root directory — set it to **`backend`**
5. Click **Deploy**
6. Once deployed, click **Variables** tab and add these exactly:

```
SUPABASE_URL         = https://abcdefghijkl.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGci...your-full-service-key
PORT                 = 3001
FRONTEND_URL         = https://openvoice.vercel.app
```

(You don't have the Vercel URL yet — put a placeholder and update it after Step 3)

7. Go to **Settings** → **Networking** → click **Generate Domain**
8. Copy your Railway URL — it looks like:
   `https://openvoice-production-a1b2.up.railway.app`
9. Test it: open `https://your-railway-url.up.railway.app/health` in a browser
   You should see: `{"ok":true,"app":"OpenVoice"}`

---

### Step 3 — Deploy frontend to Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New** → **Project**
3. Import your `openvoice` repository
4. **IMPORTANT:** Set Root Directory to **`frontend`**
5. Under **Environment Variables**, add these three:

```
VITE_SUPABASE_URL      = https://abcdefghijkl.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGci...your-anon-key
VITE_API_URL           = https://openvoice-production-a1b2.up.railway.app
```

6. Click **Deploy**
7. Wait about 90 seconds
8. Copy your Vercel URL — looks like: `https://openvoice.vercel.app`

---

### Step 4 — Wire everything together

**Update Railway:**
1. Go back to Railway → your project → Variables
2. Update `FRONTEND_URL` to your actual Vercel URL:
   `FRONTEND_URL = https://openvoice.vercel.app`
3. Railway auto-redeploys in about 30 seconds

**Update Supabase:**
1. Go to Supabase → **Authentication** → **URL Configuration**
2. Add `https://openvoice.vercel.app` to **Redirect URLs**
3. Set **Site URL** to `https://openvoice.vercel.app`

**Test production:**
Open your Vercel URL in Chrome. Create an admin account. Create an event.
Join from your phone using the QR code. The full flow should work.

---

### Step 5 — Every time you update code

```powershell
git add .
git commit -m "description of change"
git push
```

Vercel and Railway both auto-deploy on every push to main. No manual steps.

---

## PART 3 — HARDWARE CONNECTION

### What you need to buy

| Item | Where to buy | Approximate cost |
|------|-------------|-----------------|
| Passive DI box (Behringer DI20 or Radial ProDI) | Amazon India, local music shop | ₹1,500–3,000 |
| 3.5mm TRS to 6.35mm (¼ inch) TS cable, 1m | Amazon India, electronics shop | ₹200–400 |
| XLR male to XLR male cable, 5m | Amazon India, music shop, or borrow from college AV | ₹300–800 |

**The XLR cable**: before buying, check with your college AV room — they almost certainly have spare XLR cables. This can save you ₹300–800.

---

### The complete signal path

```
Attendee's phone (mic)
    ↓  WebRTC peer-to-peer  (~100ms)
Laptop (Chrome, Host Audio tab)
    ↓  3.5mm TRS cable
DI Box  INPUT jack (6.35mm / ¼ inch)
    ↓  XLR balanced cable
Venue Mixer  (any free channel input)
    ↓  Mixer output
PA Speakers
    ↓
Audience hears the speaker's voice
```

---

### Step-by-step physical connection

**Before the event starts — on the moderator laptop:**

1. Plug the 3.5mm end of your cable into the laptop's headphone jack (the small round port on the side)
2. Plug the 6.35mm (large jack) end into the socket labelled **INPUT** on the front of the DI box
   — do NOT plug into the socket labelled "THRU" — that is for daisy-chaining another instrument
3. Take the XLR cable and plug one end into the socket labelled **OUTPUT** or **XLR OUT** on the DI box
   — push firmly until you hear a click (XLR connectors have a latch)
4. Run the XLR cable to the venue's mixer and plug into any free channel input (e.g. Channel 4)
5. Open Chrome on the laptop and go to your Vercel URL
6. Sign in as admin → create an event → click **Open Audio Host (DI box)** button
7. In the "Audio output device" dropdown, select **Headphones** or **Built-in Output**
   — this is the physical 3.5mm headphone jack you plugged the cable into
8. Set the volume slider to 100%

**On the venue mixer:**
1. Find the channel strip you plugged the XLR into (e.g. Channel 4)
2. Make sure the MUTE button is NOT lit (channel must be active)
3. Set the channel fader to **0 dB** (unity) — usually marked with a line or "U" near the top of the fader
4. Turn the GAIN/TRIM knob to about 7 out of 10 — you'll fine-tune this during soundcheck

---

### Soundcheck procedure (do this 30 minutes before the event)

1. All hardware connected as above
2. Host Audio tab open in Chrome, correct output device selected, volume at 100%
3. Ask a team member to join the event on their phone
4. Admin approves them from the moderator dashboard
5. They speak into their phone
6. Watch the channel meter on the mixer — it should move when they speak
7. Adjust the GAIN knob until the meter peaks at around -6 to -12 dB (healthy signal level)
8. You should hear their voice clearly through the venue PA speakers
9. Test 2–3 more people to confirm the queue, approval, and audio all work end-to-end

---

### Troubleshooting during setup

**You hear a constant low 50Hz hum from the PA speakers:**
Flip the **Ground Lift** switch on the DI box to ON.
This breaks the ground loop between your laptop's power supply and the mixer's mains connection.
The hum stops immediately when you flip it.

**No sound at all from PA speakers:**
Check in this order:
1. Is the Host Audio tab open in Chrome? (not just the moderator dashboard)
2. Is the correct output device selected in the dropdown? (not Bluetooth, not HDMI)
3. Is the Host Audio volume slider at 100%?
4. Is the mixer channel fader up and mute button not lit?
5. Did the attendee allow microphone permission on their phone?

**Voice heard through laptop speakers but not venue PA:**
The wrong output device is selected. In the Host Audio tab, change the dropdown from "Built-in Speakers" to "Headphones" or "Built-in Output" — that's the physical jack the cable is plugged into.

**Mic does not activate on iPhone:**
The page must be served over HTTPS. On localhost this will not work for iPhone mic access.
Use your production Vercel URL (which is always HTTPS) to test with iPhones.

**WebRTC fails on college campus WiFi:**
College networks use client isolation — phones on the same WiFi cannot connect directly.
Solution: enable a personal 4G/5G mobile hotspot on one team member's phone.
Connect the moderator laptop AND all test phones to this hotspot.
Test on your own hotspot before the event — never assume college WiFi will work.

**Queue does not update live on the moderator dashboard:**
The Supabase real-time publication was not enabled.
Go to Supabase → SQL Editor → run these two lines:
```sql
alter publication supabase_realtime add table public.speaker_queue;
alter publication supabase_realtime add table public.attendees;
```

---

### Day-of-event checklist

- [ ] Laptop charged + charger plugged in
- [ ] 3.5mm cable: laptop → DI box INPUT
- [ ] XLR cable: DI box OUTPUT → mixer channel
- [ ] Chrome open to Vercel URL, admin signed in
- [ ] Host Audio tab open, correct output device, volume = 100%
- [ ] Mixer channel: mute off, fader at 0dB, gain adjusted during soundcheck
- [ ] Personal 4G hotspot ready (do not rely on venue WiFi)
- [ ] QR code printed A4 size and visible to all attendees
- [ ] Soundcheck done 30 min before event
- [ ] Ground lift on DI box: ON if hum, OFF if clean

---

## Project structure

```
openvoice/
├── backend/
│   ├── server.js              Express API, all endpoints, JWT auth
│   ├── supabase_schema.sql    Run this once in Supabase SQL editor
│   ├── package.json
│   ├── railway.json           Railway deployment config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.tsx        Home — role selector
    │   │   ├── AdminLogin.tsx     Admin sign in / create account
    │   │   ├── AdminDashboard.tsx Event list, create event, QR code
    │   │   ├── AdminSession.tsx   Live moderator view, queue management
    │   │   ├── Attendee.tsx       Join page + room page (mic activation)
    │   │   └── HostAudio.tsx      WebRTC receiver + DI box output routing
    │   ├── components/UI.tsx      Logo, MicRing, WaveBars, Particles
    │   ├── context/AuthContext.tsx Admin JWT + attendee session state
    │   ├── hooks/useWebRTC.ts     Full WebRTC peer connection + audio routing
    │   └── lib/supabase.ts        Supabase client + token helper
    ├── vercel.json
    └── .env.example
```
