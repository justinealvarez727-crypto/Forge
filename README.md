# PromptForge

Turn a rough idea into a well-engineered AI prompt, then learn why it works.
Offline-first PWA. No account, no backend, no API key. Everything stays in the browser.

## What it does

- **Generate**: type a rough idea ("write a friendly email for my landlord, under 120 words"). The engine infers task type, audience, tone, format and length, fills a role, techniques and constraints, and assembles a structured prompt. Every field stays editable.
- **Quality score**: a weighted linter (goal, context, audience, role, constraints, format, examples) that tells you what to add, not just a number.
- **Library**: save, search, favorite, edit, copy, import and export prompts as JSON.
- **Learn + Review**: 12 prompt-engineering lessons, each with a weak/strong example and a flashcard scheduled by a Leitner system.
- **Templates**: seven starter prompts (email, summarizer, explainer, code reviewer, classifier, brainstorm, planner).

Out of scope by design: epub reading and dictionary features.

## Stack

React 18 + TypeScript, Zustand (persist), Tailwind CSS, Framer Motion, React Router, Vite, vite-plugin-pwa, Vitest.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine unit tests (Leitner, inference, builder, scorer)
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
npm run analyze    # build + dist/stats.html bundle treemap
npm run icons      # regenerate PWA PNG icons from public/favicon.svg
```

## Architecture

```
src/
  types.ts            shared domain types
  engine/             pure TypeScript, no React: easy to test
    infer.ts          idea -> PromptSpec (rule-based, offline, deterministic)
    defaults.ts       per-task role, techniques, format, constraints
    build.ts          PromptSpec -> text (XML / Markdown / plain layouts)
    score.ts          quality linter with coaching tips
    leitner.ts        spaced-repetition scheduler
  stores/             Zustand + persist (draft, library, review, settings, toasts)
  data/               lessons and starter templates
  components/         layout, error boundary, UI primitives, editor, preview
  pages/              Generate, Library, Learn, Review, Settings (lazy-loaded)
  lib/                clipboard/util, speech (read aloud), perf monitoring
```

Key decisions:

- **Derived, not stored.** The prompt text and score are computed from the spec with `useMemo`, so they can never go stale.
- **Pure engine.** All logic lives outside React; the store only holds state. That is why the whole engine is covered by fast unit tests.
- **Rule-based inference.** Instant, offline, deterministic, private. To add an LLM-powered mode later, implement the same `idea -> PromptSpec` signature behind a setting.
- **Persistence.** Each store has its own localStorage key and `version` for future migrations. The review store backfills cards for lessons added in later releases.

## Leitner scheduling

Interval for box `b` is `1 * 2^(b-1)` days: **1, 2, 4, 8, 16** across five boxes.

- Correct answer: move up one box (capped at 5).
- Miss: back to box 1 (classic) or down one box (gentle, in Settings). Either way the card is due tomorrow.
- Due dates snap to the **start of a local day** and use calendar-day arithmetic, so DST changes never shift a card by a day.
- Review queues order weakest box first, then most overdue.

## Accessibility (WCAG 2.1 AA)

Semantic landmarks and a skip link; every control labelled; visible focus ring; 44px touch targets; colour tokens tuned for 4.5:1 contrast in light and dark; status never conveyed by colour alone; `aria-live` toasts; `role="progressbar"` in review; keyboard shortcuts in review (Space reveals, 1 missed, 2 got it); `prefers-reduced-motion` honored globally and by Framer Motion (`MotionConfig reducedMotion="user"`).

## Performance

Route-level code splitting (`React.lazy`), vendor chunks for React and Framer Motion, long-cache hashed assets, precached shell. Built-in monitoring (`src/lib/perf.ts`) records FCP, LCP, CLS, INP and TTFB with `PerformanceObserver`, shows them in Settings, and beacons them to `VITE_TELEMETRY_URL` only if you set it.

## Deploy

**Vercel** (default): import the repo, framework preset *Vite*. `vercel.json` already sets the build command, SPA rewrites, immutable caching for `/assets`, no-cache for the service worker, and basic security headers.

**Netlify**: build command `npm run build`, publish directory `dist`, and add `public/_redirects` containing `/* /index.html 200`.

Environment variables (all optional): see `.env.example`.

## Extending

- New lesson: add an entry to `src/data/lessons.ts`. Its flashcard appears automatically.
- New task type: add it to `TaskType`, `TASK_PROFILES`, and a rule in `infer.ts`.
- New template: add a `PromptSpec` to `src/data/templates.ts`.
