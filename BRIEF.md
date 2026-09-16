---
workflow: general-video
flow: companion
storyboard: yes
message: "tResolv doesn't just answer support tickets — it actually does the support work, with a human approving the one moment that matters."
destination: "landing page / sales embed"
aspect: "16:9"
length: "~78s (voiceover is 35.1s; the remainder is deliberate silence/UI dwell)"
angle: "show-it-as-is: real product screens are the asset, not a marketing metaphor"
language: en
audience: "Shopify founders/merchants evaluating tResolv"
---

## Intent

Premium, minimal, calm B2B SaaS product demo. Spine of the video is ONE real
workflow — order cancellation — shown end to end: customer request → tResolv
understands → real Shopify order found → cancellation prepared → human
approves → real Shopify state changes → resolved. Section 6 briefly proves
the same mechanism generalizes (a product/policy question, grounded in real
store data). No feature tour. No fabricated UI, metrics, dashboards, Gmail,
or Shopify-admin screens — only the real tResolv dashboard as it exists in
`D:\hack5\hack5\dashboard\src`, captured live.

## Voiceover (verbatim, locked — do not rewrite/extend/trim)

Audio file: `media/voiceover.mp3` (copied from
`C:\Users\Zohaib\OneDrive\Desktop\prodcut_demo\ElevenLabs_2026-09-11T09_10_16_Hannah - All-American, bright, natural_pvc_sp95_s30_sb98_se52_b_m2.mp3`)
Duration: **35.134688s** (ffprobe-confirmed). Transcript verified with
faster-whisper against the script below — exact match, 15 segments.
Word-level timings: `tools/vo-transcript.json`.

The video runs **~78s** — the VO's 35s of speech is distributed across that
runtime as individual line clips with deliberate silence between them
(`data-media-start` + `data-duration` on separate `<audio>` elements slicing
the one source file). Nothing is rewritten, re-read, re-timed internally, or
regenerated; the silence between lines is the point, per the user's explicit
direction that the UI does the explaining.

**Correction logged:** an earlier candidate file
(`...T06_33_34...mp3`, 136.7s, from Downloads) was transcribed and found to
contain an entirely different, longer feature-tour script naming order
"#1012" — it was NOT this script. Discarded. Never build against an
untranscribed VO.

> Most AI support bots can answer.
> But can they actually do the work?
> A customer wants to cancel an order.
> tResolv finds it in Shopify.
> It checks the request...
> and prepares the action.
> You approve it.
> And the change happens in Shopify.
> That's the difference.
> The AI does the work.
> You stay in control when it matters.
> And this isn't limited to cancellations.
> The same employee can handle everyday support questions and other store actions.
> It uses your products, policies, and store information...
> so it can actually work from your business context.
> tResolv.
> Your Shopify store's AI support employee.

## Assets

- `media/brand/tresolv-wordmark.png` — teal "t" + black "Resolv", transparent PNG (source: `C:\Users\Zohaib\OneDrive\Desktop\prodcut_demo\Gemini_Generated_Image_7ign1o7ign1o7ign-removebg-preview.png`)
- `media/brand/tresolv-icon.png` — teal/black "tR" mark, transparent PNG (source: same folder, `...y81rmjy81rmjy81r-removebg-preview.png`)
- `media/voiceover.mp3` — locked VO, see above
- Real login for capture: local dashboard-dev (`http://localhost:5173`, from `.claude/launch.json`), account `syedahafsa1983@gmail.com` — real Shopify + Gmail connected. **This is production data reached through the local dev frontend** (dashboard's `.env` points `VITE_API_BASE_URL` at `https://backend.tresolv.online`), not a mock backend.
- Real hero data created for this shoot (see Notes): Shopify order **#1011** (`tresolv.myshopify.com`), customer "Syeda Hafsa" / `syeda.hafsa@example.com` (RFC 2606 reserved placeholder domain — not a real inbox), 1× Floral Print Shirt Dress, $95.00. A real `cancel_order` action is pending approval on this order (brand: "Syedahafsa1983's Store", brand_id `549ee056-c5c4-4c4e-8eed-e6d47c6591f7`).
- Real secondary ticket for the broader-capability beat: ticket `#6dc34482` (bushrazohaib85@gmail.com), AI reply "Dear Bushra, we sell a variety of dresses..." — matches the screenshot the user supplied at the start of this project.

## Customizations

- No fabricated UI, metrics, Gmail inbox, Shopify-admin screens, dashboards, or success graphics — real captured screens only.
- ~85% product / ~15% graphics. Graphics limited to: opening hook card, brief transition cards, closing card.
- Camera language: push in → follow → hold → reveal → pull back. No constant cuts, no glassmorphism/gradients/particles/3D.
- Brand system: background `#F2F6F7`, accent `#0EB0C4`, text `#0A0A0A`, body Helvetica/Helvetica Neue, display DM Serif Display.
- Audio: locked VO, subtle UI-click/interaction SFX, silence held during the approval→Shopify-change proof beat, extremely subtle/no bed music.
- Privacy: no real third-party customer PII on screen. Demo customer identity is "Syeda Hafsa" with a non-PII placeholder email; the real address never renders on screen (name displays natively in the real UI, so no pixel-editing/fabrication was needed).

## Notes

- Backend/DB reality check done live during prep: local `backend-dev` (port 8001) cannot decrypt this brand's stored Shopify/Gmail tokens locally (`ENCRYPTION_SECRET` mismatch — local dev secret differs from production's). The dashboard frontend bypasses this entirely by calling `https://backend.tresolv.online` directly (per `dashboard/.env`), so all captures reflect **real production behavior**, not a broken local stub.
- Order #1009 (the first candidate hero order, real customer Bushra Zohaib) was rejected for the shoot: its real identity-verification gate correctly refused a mismatched-email cancellation attempt (proving the security feature works), and its message contains profanity unsuitable for the video. Replaced with a freshly created real order (#1011) under a clean, non-PII identity, created via the real Shopify Admin API and pushed through the real `/api/v2/widget/chat` endpoint — same code path a live embedded widget uses, not a shortcut or mock.
- Real captures now exist on disk at `media/captures/*.png`, taken by
  `tools/capture*.mjs` (puppeteer-core driving system Chrome against the local
  dashboard at 1600x900 @2x → 3200x1800 PNGs). Each grab asserts required
  on-screen strings before saving, so an error state or an empty queue can
  never be silently captured — an early pass did exactly that and was caught.
- **Do not trust an un-asserted capture.** One pass overwrote a good
  Escalations shot with a "Pending Approvals: 0" fetch failure. The pending
  actions were fine — verified directly against `/api/v1/actions/pending`,
  which still lists `cancel_order | 1011 | Syeda Hafsa | pending`. Shopify
  order #1011 also confirmed still `PAID / UNFULFILLED`. Nothing was executed.
- The proof beat uses order **#1010** — a real, previously completed
  cancellation for the same customer (Syeda Hafsa), already showing
  `paid / restocked / cancelled`. No new mutation was needed or performed.
