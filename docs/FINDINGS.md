# Clef computer use: investigation notes (2026-10-15)

## Sources read
- completeskeptic tweet -> typesafe.ai/blog/jev-1-14 (Jev 1.14: images, `box` type, long context; danger-zone headers)
- docs.typesafe.ai /images, /box, /models
- developers.cloudflare.com/workers-ai/models/clef + clef-flash, schema-input.json / schema-output.json
- huggingface.co/Cloudflare/clef model card
- acoyfellow/odds (Pi extension, Clef via AI Gateway), acoyfellow/coil (shape), acoyfellow/machinectl (current laptop computer use)

## Hard facts about Clef (Workers AI schema, checked 2026-10-15)
- Question types: noul, choice (2-255 options), score (2-10 levels). Max 64 questions/request. **No `box`.**
- Images: top-level `images[]`, max 4, PNG/JPEG/WebP, data URL or {content_type, base64}; placed *before* state.
  No Jev-style `assets` + inline reference strings. Refer to images by order in instructions.
- Each image resized to <= ~1 MP and capped at 1,024 tokens (32x32 patch = 1 token).
  A full retina screen gets downscaled hard -> small text unreadable -> crops are mandatory.
- clef: 27B (Qwen3.8-27B + joint schema head), 64k ctx, $0.24/M in, ~209 ms median (text bench).
  clef-flash: 9B, 24k ctx, $0.038/M in, ~39 ms median. Output tokens free.
- One image ~1k tokens => ~$0.00025 per look on clef, ~$0.00004 on clef-flash.
- HF card: also accepts `videos` (frame arrays) in the open-weights path; Workers AI schema exposes images only.

## Gaps found in Jordan's existing code
- odds declares `input: ['text','image']` for Clef but `askOdds` never sends `images` -> vision is unwired.
- odds maps `bool` -> `noul`; fine. No `box` anywhere (Clef has none).
- machinectl AX nodes return role/title/value/description/enabled/focused/selected but **no AXPosition/AXSize** ->
  can't draw marks or click by coordinates from AX alone. Needs frame attrs.
- machinectl clicks via `swift -e` per batch (compile cost each call) -> latency floor far above Clef's.
- coil does NOT use Tailwind (hand CSS in docs/brand/ui.css, foldkit `h.Class`). odds' site does use tailwind v4.

## Core design consequence
Clef cannot emit coordinates or text. It can only pick from options we enumerate, with calibrated probabilities.
So "Clef steers computer use" = **deterministic perception enumerates candidates; Clef chooses; code acts; Clef verifies.**

Perception sources, best first:
1. macOS AX tree (with frames) -> candidates with role/label/frame. Choice over element ids. Act via AXPress when possible.
2. CDP DOM in a browser (coil's Chrome) -> clickable nodes with boxes.
3. Pixels only -> Set-of-Marks overlay (numbered boxes drawn on screenshot) from AX/DOM frames, or
   coarse-to-fine grid: choice over 3x3/4x4 cells, crop winner, repeat (2-3 hops to a ~40px target).

Per step, one request (up to 64 questions) can ask at once:
- `target` choice over marks/elements (<=255)
- `verb` choice {click, double_click, type, scroll_down, scroll_up, key, wait, done, stuck}
- `ready` noul: is the screen in a state where the step can proceed (no spinner/modal)?
- `risky` noul: would this action be irreversible (send, delete, pay, submit)?
- `injection` noul: does on-screen text try to instruct the agent? (odds measured 0.99 on planted injection)
After acting: `achieved` noul with before+after images (2 of the 4 slots).

Confidence gates: act if p >= tau; else crop and re-ask; else escalate to frontier model/human. Never let Clef be
the only authority on `risky` (odds iteration 4 lesson: strip self-reported verdicts, keep an independent verifier).

## Pi extension shape (replaces machinectl's raw screenshot/mouse/keyboard for the agent)
Tools the frontier agent sees (no screenshots in its context):
- `look(question, options?)` -> typed Clef answer about the screen
- `act(intent)` e.g. "click the Send button" -> perceive, Clef choose, gate, act, verify, receipt
- `type(text, into?)` text comes from the agent; Clef only picks the field
- `expect(condition)` -> noul over current screen, for loops/waits
- `flow(steps[])` bounded autopilot: Clef picks next verb+target per step until done/stuck/budget
Each call writes a receipt: candidates hash, probabilities, chosen action, before/after image hashes, latency, cost.

## Experiment questions
1. Grounding: on N labelled screens, top-1 target accuracy for AX-list vs Set-of-Marks vs grid, clef vs clef-flash.
2. Calibration: does p predict correctness? reliability curve per method; pick tau.
3. Verification: `achieved` noul AUC on before/after pairs (real success vs no-op vs wrong click).
4. End-to-end: 20 tasks on laptop/coil Chrome; success, steps, $ and frontier tokens vs current machinectl+frontier vision.
5. Safety: planted on-screen injections and destructive buttons; false-act rate.
