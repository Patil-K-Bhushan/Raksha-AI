# RakshaAI — Build Spec (AGENTS.md)
### OpenAI × NamasteDev Codex Hackathon · Build window: Jul 15–19, 2026 · Deadline: Jul 19, 23:59 IST

---

## 1. One-line pitch
**Everyone builds scam detectors that say "yes/no." Raksha does a scam AUTOPSY — it dissects the message, shows you the manipulation tactics line by line, tells you exactly what the scammer wants next, and protects your parents in their own language.**

Opening demo line: *"Indians lost ₹22,500 crore to cyber fraud last year. Everyone in this room got a scam text this week. Detection isn't the problem — understanding is."*

## 2. The product
A hosted web app (Next.js on Vercel). User pastes ANY suspicious content — SMS, WhatsApp forward, email, call transcript, job offer, UPI collect request, or uploads a screenshot — and Raksha returns:

1. **Verdict + confidence** (Scam / Suspicious / Likely safe — never a false "100% safe")
2. **The Trap Map** (hero feature) — the message rendered with each manipulative segment highlighted and labeled:
   - 🔴 Fake authority ("This is Delhi Police / RBI / customs")
   - 🟠 Manufactured urgency ("within 2 hours or account blocked")
   - 🟡 Fear/threat ("digital arrest", "legal action")
   - 🟣 Greed hook ("guaranteed returns", "₹5,000/day part-time")
   - 🔵 The extraction point — the exact line where they'll ask for OTP/money/remote access
3. **"What happens next" prediction** — the scammer's next 2–3 moves if you engage ("Next they will send a video call from a fake police station background…"). This is the wow moment: Raksha knows the script.
4. **One clear action** — a single instruction ("Do not reply. Block. Report at cybercrime.gov.in / call 1930.")
5. **Scam type ID** — matched against known Indian scam patterns (digital arrest, UPI collect, fake parcel/FedEx, loan app, task/job scam, KYC expiry, electricity bill, deepfake investment)

## 3. Grandma Mode (the differentiator — build day 3)
- A toggle/simple view: output rewritten in **plain Hindi / Marathi / English** (user picks), short sentences, big text, zero jargon.
- Demo flow: paste the same digital-arrest scam → flip to Grandma Mode → warning appears in plain Hindi with one action.
- Roadmap slide (do NOT build): WhatsApp bot number parents forward to; family alert notifications.

## 4. Advanced features (locked — only these two)
- **Interrogate the scam**: after the autopsy, a chat panel — "Why is this fake? The number looked real." Raksha answers grounded in the analysis. Makes it feel alive.
- **Scam Simulator (Tier-2, if Day 3 has room)**: "Test yourself" — Raksha generates a realistic fake scam message, user tries to spot the traps, then Raksha reveals the Trap Map. Teaching loop. Great judge moment; cut first if time is short.

## 5. HARD CUT LIST — do not build
- Login/auth (judges must use it in one click)
- Database of reports/history (in-memory + seeded examples only)
- Real WhatsApp/Twilio integration (roadmap slide only)
- Live URL/link scanning, phone-number lookups against real databases
- Browser extension, mobile app
- Anything without a beat in the 3-minute demo

## 6. Tech stack
- **Next.js 14 (App Router) + Tailwind**, deployed on Vercel
- **OpenAI API** (built via Codex — REQUIRED; keep Codex driving commits from day 1)
  - Text analysis: one structured-output call returning JSON: `{verdict, confidence, scam_type, segments:[{text, tactic, explanation}], next_moves[], action, language_outputs:{hi, mr, en}}`
  - Screenshot input: vision call → extract text → same pipeline
- **No DB.** Seed 6–8 real (anonymized) scam examples as one-click demo chips: digital arrest, UPI collect, fake parcel, job scam, loan app, KYC expiry.
- Single API route (`/api/analyze`) so the app is one deployable unit.

## 7. UI (keep it stark and trustworthy)
- Landing: one big paste box + "Or try a real scam" example chips + screenshot upload. No marketing fluff.
- Result: verdict banner → Trap Map (message with colored highlighted spans, hover/tap = explanation) → "What happens next" timeline → one action card → language toggle → chat panel below.
- Mobile-first. Most scam checks will happen on a phone.
- Hindi/Marathi/English toggle visible top-right from the start.

## 8. 4-day build order
- **Day 1 (today):** Repo init (Codex). `/api/analyze` with structured JSON out. Paste box → verdict + basic Trap Map rendering. Ship to Vercel by tonight — ugly is fine, deployed is mandatory.
- **Day 2:** Trap Map polish (highlight spans, tactic legend, hover explanations). "What happens next" + action card. Seeded example chips. Screenshot/vision input.
- **Day 3:** Grandma Mode (plain HI/MR/EN outputs). Interrogate-the-scam chat. Scam Simulator ONLY if ahead of schedule.
- **Day 4:** Polish (loading states, error states, mobile pass). Record 3-min video. README with hero GIF + "built with Codex" section. Pitch deck (5 slides). Submit everything by evening — never at 23:50.

## 9. 3-minute demo script (1/6 of total score — rehearse it)
- 0:00 — Hook: "₹22,500 crore lost. 2.8 million complaints. My family gets these texts every week." Show a real digital-arrest message.
- 0:20 — Paste it. Verdict appears. Trap Map lights up — walk through 2 highlighted tactics ("this line is fake authority… this is where they take the OTP").
- 1:10 — "What happens next": Raksha predicts the scammer's script. Pause one beat — this is the whoa.
- 1:40 — Flip Grandma Mode → same warning in plain Hindi. "This is for my mother, not for security engineers."
- 2:10 — Ask the chat: "But the number had +91 and a police logo?" → grounded answer.
- 2:40 — Roadmap (WhatsApp bot for parents, family alerts) + close: "Detection tools say no. Raksha teaches you why — so the next scam fails too."

## 10. Judge Q&A armor
- *"Isn't this just ChatGPT with a prompt?"* → "ChatGPT gives a paragraph. Raksha gives a structured autopsy — visual trap map, script prediction, and a plain-language mode for people who will never open ChatGPT. Focus and ritual for one job, one user."
- *"Scam detectors exist (Truecaller etc.)."* → "They flag numbers and block calls. None explain the manipulation or teach the pattern — and none serve the elderly non-English victim who's the actual #1 target. Detection is solved; comprehension isn't."
- *"What about false negatives?"* → "Raksha never certifies 'safe' — max output is 'likely safe, stay cautious,' always with the one-action habit. It's a coach, not a guarantee."

## 11. Deliverables checklist (ALL required, ALL public)
- [ ] Live hosted URL (Vercel) — works logged-out, on mobile, in incognito
- [ ] ≤3-min public demo video
- [ ] Public GitHub repo, Codex-driven commit history, README with hero GIF + how-Codex-built-it section
- [ ] Pitch deck 5–7 slides (optional but do it): problem → autopsy demo → Grandma Mode → roadmap → why us

## 12. Non-negotiables
- Deploy Day 1. Everything after improves a live product.
- Codex fingerprint on the code (it's the required tool AND the prize).
- Every feature must map to a demo beat or it doesn't exist.
- Rehearse the demo twice on Day 4 with a timer.

