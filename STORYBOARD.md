# tResolv product demo — storyboard

**Runtime: ~78s · 16:9 · 1920×1080 · 30fps**

Voiceover is **35.13s** of speech (`media/voiceover.mp3`), sliced into 13 line
clips and distributed across the 78s timeline with deliberate silence between
them. Every timing below comes from the faster-whisper transcript
(`tools/vo-transcript.json`) — measured, not estimated. The source audio is
never re-read, re-timed internally, pitch/tempo-shifted, or regenerated; each
clip is a `data-media-start` / `data-duration` slice of the one file.

Silence is load-bearing: the longest hold in the piece (≈9.5s, 32.5s→42s) sits
on the Shopify execution proof, with no voice over it at all.

---

## Audio placement map

| # | Line | Source in/out | Timeline start |
|---|------|--------------|----------------|
| L1 | "Most AI support bots can answer," | 0.00–1.90 | 0.5s |
| L2 | "but can they actually do the work?" | 2.10–4.10 | 3.0s |
| L3 | "A customer wants to cancel an order." | 4.35–5.95 | 8.0s |
| L4 | "tResolv finds it in Shopify." | 6.40–8.05 | 15.5s |
| L5 | "It checks the request and prepares the action." | 8.40–10.85 | 22.0s |
| L6 | "You approve it and the change happens in Shopify." | 11.30–13.80 | 30.0s |
| L7 | "That's the difference." | 14.15–15.00 | 43.0s |
| L8 | "The AI does the work." | 15.30–16.65 | 44.8s |
| L9 | "You stay in control when it matters," | 16.90–18.45 | 46.8s |
| L10 | "and this isn't limited to cancellations." | 18.70–20.80 | 49.2s |
| L11 | "The same employee can handle everyday support questions and other store actions." | 21.00–24.95 | 52.0s |
| L12 | "It uses your products, policies, and store information. So it can actually work from your business context." | 25.20–30.95 | 60.0s |
| L13 | "tResolv, your Shopify store's AI support employee." | 31.40–34.70 | 71.0s |

---

## Frame 1 — Hook
`src:` graphic · `status:` outline · **0.0s – 6.5s**
**VO:** L1, L2
Background `#F2F6F7`. "Most AI support bots can **answer**." — accent `#0EB0C4`
on the last word, DM Serif Display. Second line replaces it: "But can they
**actually do the work**?" Hard cut to product at 6.5s, mid-breath. No logo
sting, no stock footage.

## Frame 2 — Customer request
`src:` `media/captures/02-escalations.png` · `status:` capturing · **6.5s – 15.0s**
**VO:** L3 at 8.0s, then **5.4s of silence to read the request**
Real Escalations page. Push in on the live "Cancel Order · Order #1011 ·
Syeda Hafsa" card and its real quoted request *"Hi, can I cancel order
#1011?"*. VO names the situation once; the card says the rest.

## Frame 3 — Finds the real order
`src:` `media/captures/07-ticket-detail.png` · `status:` capturing · **15.0s – 22.0s**
**VO:** L4 at 15.5s, then silence
Reveal the real **Order Context** panel — #1011, paid, Floral Print Shirt
Dress, $95.00, pulled live from Shopify. This is the "it has access to the
store" proof; hold it long enough to read the line items.

## Frame 4 — Checks and prepares
`src:` `media/captures/07-ticket-detail.png` (Activity region) · `status:` capturing · **22.0s – 30.0s**
**VO:** L5 at 22.0s, then ~5s silence
Follow the real **Activity** checklist: *New customer message received → Order
#1011 mentioned → Analyzing request… → Finding order #1011… → Shopify order
found → Preparing your answer… → Draft ready*. Then settle on the prepared
action with its "Cancel in Shopify" button and "Policy check required" badge.

## Frame 5 — Approval + THE PROOF
`src:` `media/captures/08-approval-executed.png` · `status:` **BLOCKED — needs approval to execute** · **30.0s – 43.0s**
**VO:** L6 at 30.0s, then **9.5s of total silence (32.5s → 42.0s)**
Cursor to "Cancel in Shopify", one simple click — no animated checkmark, no
"AI APPROVED" badge. Then hold, silent, on the real resulting state: the
execution-result copy `Actions.jsx` actually emits —
*"Order #1011 cancelled. Stock restocked. Customer notified by Shopify."*
This is the single most important shot; it gets the least decoration and the
most time.
> **Not yet capturable.** Requires the real, irreversible Shopify cancellation
> on #1011, which the user has explicitly withheld. v1 builds with the pending
> state held and this shot marked missing — no fabricated success state.

## Frame 6 — Verdict
`src:` graphic · `status:` outline · **43.0s – 49.0s**
**VO:** L7, L8, L9
Three short lines over a quiet branded card, or over a pulled-back framing of
the just-changed screen. Minimal type: "The AI does the work. / You stay in
control when it matters." Accent on "does the work" and "in control".

## Frame 7 — Broader capability
`src:` `media/captures/01-inbox.png`, `03-review-queue.png` · `status:` capturing · **49.0s – 60.0s**
**VO:** L10 at 49.2s, L11 at 52.0s
Two real screens, no more: the real Inbox (proving volume/other request types
— real Refund/Cancel/Exchange tags visible), then the real "Review Luna's
Work" queue with its Approve / Edit & Approve / Reject controls. Not a feature
parade — this beat only widens the mental model.

## Frame 8 — Grounded in your store
`src:` real ticket showing the product-question reply · `status:` capturing · **60.0s – 71.0s**
**VO:** L12 at 60.0s, then ~4s silence
The real AI reply naming real catalogue items ("Emerald Green Wrap Dress,
Floral Print Shirt Dress, Black Wrap Maxi Dress") — actual SKUs from
`tresolv.myshopify.com`, which is what makes the "your products, policies,
store information" line literal rather than a claim.

## Frame 9 — Close
`src:` `media/brand/tresolv-wordmark.png` · `status:` outline · **71.0s – 78.0s**
**VO:** L13 at 71.0s
Wordmark on `#F2F6F7`, tagline beneath in Helvetica. Settle, hold, end. No
CTA, no metrics, no feature list.

---

## v1 build notes (what actually shipped)

The proof beat no longer needs a new Shopify mutation. Syeda Hafsa already has
a **completed, real cancellation on order #1010** in this store — request →
activity trail → `paid / restocked / cancelled` → "Your order has been
successfully cancelled." That is the execution proof, captured as
`media/captures/07-cancel-1010.png`, and #1011's pending approval (verified
still pending via `/api/v1/actions/pending`) carries the request and approval
beats.

Privacy: every real customer email address on screen is masked by a `.redact`
block that lives inside the camera wrapper, so it tracks the push exactly —
the ticket header address, the Order Context address, and the entire SENDER
column of the inbox. Verified frame by frame in `.review2/`.

## Open items
1. **Order numbers differ across the cut** — the request and approval beats
   show **#1011** (real, pending); the order-data and proof beats show
   **#1010** (real, executed). Both are genuine, but a careful viewer sees two
   numbers. The clean fix is to approve executing #1011's pending cancellation
   and re-capture, which makes the whole spine one order. Awaiting the user's
   explicit go-ahead — not done.
2. The hook/verdict/close cards are typographic. If a shipped registry block
   suits them better, swap during polish.
