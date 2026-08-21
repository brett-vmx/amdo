# Amdo App — Claude Code Context

## What this project is
A mobile-first PWA story player for 11 oral Bible stories ("Creation to Christ") narrated in the Amdo dialect of Tibetan. All UI/text is English — no written Tibetan script appears anywhere in the app. Rebuilt from a Glide app of the same name. Modeled directly on the sibling C2C app's architecture.

Live at: https://amdo.app (Netlify site `amdo-app`, GitHub-connected auto-deploy on push to `main`)
Repo: https://github.com/brett-vmx/amdo
Materials/source assets: `~/Documents/PROJECTS/Amdo` (CSVs, screenshots, raw video/audio downloads, logo)

---

## Tech stack
- **Astro 5** with TypeScript, static output (no SSR adapter)
- **Tailwind CSS v4** via Vite plugin
- **Astro Content Collections** using the Astro 5 loader API (glob loader in `src/content.config.ts`, NOT the legacy `src/content/config.ts`)
- **@vite-pwa/astro** for PWA/service worker
- **Lucide icons**
- **Deploy: Netlify** (static build, no server functions) — site `amdo-app`, connected to GitHub for auto-deploy on push to `main`
- **Media: Cloudflare R2** — video and audio are NOT bundled in the repo; both are hosted on R2 and referenced by absolute URL

---

## Architecture decisions — do not change without discussion

### Single-page app via modal
Same as C2C: story cards open a modal populated from `window.__STORIES__` (embedded via `define:vars`), not a navigation to `/story/[slug]`. The static `/story/[slug]` pages exist as a fallback for direct URL / shared-link access but are not used for in-app navigation.

### No Story Groups view, no set/toggle
Unlike C2C, this app has only one story set (11 stories, no "Additional Stories" or "Full Story" composite) and no Amdo/English language toggle — the Glide app's Amdo/English toggle only affected which written script displayed captions in, and per the client's request no written Tibetan appears here at all. The `set` field from C2C's schema was dropped entirely.

### Video AND audio, as separate players — video first
Each story has both a video (with Amdo narration, visuals) and an independently-recorded audio-only track (same story, different recording length). These are NOT the same file with the audio extracted — check `videoDuration` vs `audioDuration` per story, they differ by several seconds.
- **WATCH** section: native `<video controls preload="none" poster={cover}>` — no custom player. Native gives free fullscreen/PiP and is simplest to maintain since video interaction is comparatively rare.
- **LISTEN** section: C2C's exact custom audio player (64×64 navy play/pause circle, flex-grow range input progress bar, `M:SS / M:SS` display, hidden native `<audio>` element) — carried over unchanged for visual consistency across projects.
- WATCH is placed above LISTEN in the modal (client preference: video is the primary intended experience).
- Both sections have independent download buttons (`hidden md:flex`, teal download icon) using the same `window.handleDownload()` iOS-standalone-safe helper from C2C.

### Media hosting on Cloudflare R2
- Bucket: `amdo-media` (Cloudflare account `Brett@vmx.media's Account`, account ID `66bcad746baae7c2984ca1b91be6d70d`)
- Public access: custom domain `https://media.amdo.app` (attached via `wrangler r2 bucket domain add`; the r2.dev managed URL is no longer used in the app, though it still works as a fallback)
- CORS: `GET`/`HEAD`, all origins, `Range`/`Content-Type` request headers, exposes `Content-Length`/`Content-Range`/`Accept-Ranges` — required for `<video>`/`<audio>` seeking to work cross-origin
- Object keys: `video/[order]-[Title-With-Hyphens].mp4`, `audio/[order]-[Title-With-Hyphens].mp3`
- Uploaded via `wrangler r2 object put` — see `~/Documents/PROJECTS/Amdo/downloads/` for the original local copies (covers, video, audio) if buckets ever need to be recreated or migrated to another provider
- **Workbox runtime caching**: unlike C2C (which bundles small MP3s and precaches them), this app's media is too large to precache. `astro.config.mjs` adds a `runtimeCaching` rule (CacheFirst, `rangeRequests: true`, 30-day expiry, max 33 entries) so R2 origin requests get cached opportunistically after first play — offline replay works for stories a user has already opened, but the app shell itself does not prefetch media.

### No framework islands
Vanilla JS only, same as C2C. Do not add React, Preact, Vue, or any framework.

---

## Design tokens
Identical to C2C — same accent color across all sibling projects, per explicit client instruction.

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#0d2d3d` | Backgrounds, nav, play button |
| Teal | `#1a9db8` | Primary accent, links, active states |
| Light teal | `#4ecde6` | Hover highlights |
| Body font | 20px base | Tailwind default overridden |
| Card radius | 8–12px | `rounded-xl` / `rounded-card` |

---

## Content structure
Stories live in `src/content/stories/*.md` with this frontmatter schema (`src/content.config.ts`):
```typescript
{
  title: string
  order: number
  coverImage: image()        // resolved relative path in src/assets
  video: string               // full R2 URL, e.g. https://media.amdo.app/video/1-Creation-of-the-Physical-World.mp4
  audio: string               // full R2 URL, e.g. https://media.amdo.app/audio/1-Creation-of-the-Physical-World.mp3
  videoDuration: string        // "2:17" — from the Glide CSV, matches the video file
  audioDuration: string        // "2:09" — measured with ffprobe from the actual mp3, NOT in the source CSV
}
```
Markdown body = English transcript from `Amdo-Story-Set.csv`'s "English Story Text" column (already translated — no translation work needed).

**DISCUSS questions are NOT per-story** — same 6 questions on every story, matching the original Glide app (its "Questions" section lived directly in the app, not the CSV export; client supplied the exact text after the initial scaffold). Question 2 has three nested sub-bullets. This is intentionally different from C2C's discussion set — do not merge the two.

## Asset locations
```
src/assets/stories/covers/       ← source cover JPG/JPEG (mixed extensions — kept as downloaded from Glide)
public/icons/                    ← PWA icon PNGs (generated from amdo-logo.jpg via PIL, center-cropped square)
public/favicon.png               ← favicon (48×48, from amdo-logo.jpg)
public/og_image.png              ← 1200×630, logo centered on navy background (not stretched)
```
No local audio/video — see R2 section above.

## File naming convention
Covers follow: `[order]-[Title-With-Hyphens].[ext]` (ext varies — some Glide URLs were `.jpg`, some `.jpeg`)
R2 object keys follow the same `[order]-[Title-With-Hyphens]` base, under `video/` and `audio/` prefixes.

---

## Page structure
Single page (`src/pages/index.astro`): header ("Amdo Stories") → subtitle → 2-col mobile / 3–4-col desktop grid of all 11 stories, ordered 1–11. No toggle, no sections, no footnote (no external image credit needed — covers are the client's own Glide assets).

**Modal** (same anchoring/animation rules as C2C — see C2C's CLAUDE.md for the exact mobile-bottom-sheet vs desktop-centered mechanics, swipe-to-dismiss, and close-button behavior, all copied verbatim):
- Title (no separate cover-image hero — it was removed as a duplicate of the video's poster frame, which shows the same art immediately below)
- **WATCH** — native video, preload="none", poster = optimized cover
- **LISTEN** — custom audio player (copied from C2C)
- **READ** — collapsible transcript, READ MORE/LESS
- **DISCUSS** — six standard discussion questions (shared with C2C, not story-specific)

---

## What NOT to do
- Do not add SSR or any Netlify/Vercel adapter — static output only
- Do not add React, Preact, Vue, or any JS framework
- Do not navigate to `/story/[slug]` from within the app — use the modal
- Do not use `src/content/config.ts` (legacy) — use `src/content.config.ts` (Astro 5)
- Do not add a Story Groups view or a set/toggle — this app is single-set by design
- Do not add written Tibetan script anywhere in the UI
- Do not bundle audio/video files into the repo — they belong on R2
- Do not assume video and audio share a duration — they're separate recordings
- Do not add a Bible resources tab yet — client is deferring that (`Amdo-More-Bible.csv` exists but is unused for now)
- Do not add Mars Hill "The Hope" video embeds yet — client is waiting on separate permission for this app specifically

---

## Deployment / domain setup (as configured)
- **DNS**: `amdo.app` zone lives on the same Cloudflare account as R2 (`Brett@vmx.media's Account` / `66bcad746baae7c2984ca1b91be6d70d`, zone ID `475ff5055cb0de715e6f2b5a4b317be3`). Root and `www` are both **proxied CNAMEs to `amdo-app.netlify.app`** (Cloudflare flattens the apex CNAME automatically) — same pattern as the account's other Cloudflare+Netlify site, `tenpa.app`. Domain used to be pointed at Glide; that old A record was deleted before adding the CNAMEs.
- **`www` → apex redirect**: Netlify's `domain_aliases` field does NOT auto-redirect on its own — it just serves the site on both domains. The actual 301 is `public/_redirects`: `https://www.amdo.app/* https://amdo.app/:splat 301!`. Don't remove this file or the www version will silently serve dupe content instead of redirecting.
- **Netlify site**: `amdo-app` (site id `e3d44f4e-29e3-4a34-af49-8e979a772106`), custom domain `amdo.app`, domain alias `www.amdo.app`. Created via the Netlify API directly (not the CLI/UI) — the first attempt had `installation_id: null` in its repo config and failed to clone ("Host key verification failed") because API-created sites don't automatically link the GitHub App the way the UI's OAuth flow does. Fixed by PATCHing the site with the same `installation_id` (`133913030`) that the account's other working sites (e.g. `c2c-app`) already use — that ID is tied to the GitHub App installation for the `brett-vmx` account, not per-repo, so it's reusable if this ever needs to be redone.
- **Cloudflare API token caveat**: the wrangler OAuth token has `zone:read` but no `dns_records:*` scope, so DNS record changes can't be scripted with it — only R2's own custom-domain endpoint works programmatically (`wrangler r2 bucket domain add`, which manages its own CNAME outside the normal DNS API). Adding/editing ordinary DNS records requires the Cloudflare dashboard or a separately-issued API token with `Zone.DNS` edit permission.

## Other open items
- **`Amdo-More-Bible.csv`** (19 Tibetan Bible/discipleship resources) is unused — client wants to hold off on a Bible tab for now, may revisit.
- **Mars Hill "The Hope" video** — client has permission for a different app; likely to request permission for this one too, but hasn't yet. Don't add without explicit confirmation.
