# TraceProof

## Ready-to-run build

The `runtime/` directory contains the bundled application and server. With Node.js 22.13+ run `node runtime/server.mjs`, then open http://127.0.0.1:5173. No package installation is needed for this build. It uses the same evidence logic as the source below.

For a Node web service, set root directory to `runtime`, build command to `node --version`, start command to `node server.mjs`, `HOST=0.0.0.0`, and `PUBLIC_ORIGIN` to the exact HTTPS service origin. Configure `NEBIUS_API_KEY` as a private environment variable, never in this repository. The server reads the host-provided `PORT`. Keep inference access funded and available for judging. The hand-authored sample needs no API keys; a genuine live review does.

**Evidence before confidence.** An evidence review workbench for small teams checking vendor briefs and research memos.

TraceProof extracts factual claims, compares them with source notes or web research, checks every quotation against its source snapshot, and produces an inspectable review with human notes and portable evidence.

**Hackathon track:** Best Apps and Agents. **License:** [MIT](LICENSE).

## Honest project status

The sample is a fictional, hand-authored OrbitNote scenario, explicitly labelled in the UI and every export. It makes zero AI calls. The live code integrates NVIDIA Nemotron through Nebius Token Factory and optional Tavily runtime search. Provider integration has automated contract tests with mocked responses; real provider quality and latency are **not measured until API keys are configured and a live run succeeds**. Do not submit the fixture as proof of Nebius use.

## What makes it useful

- Conditions matter: “SSO on Enterprise” is not “SSO on every plan.”
- Missing evidence is a distinct outcome, not a falsehood verdict.
- Each accepted quote has a source ID, exact character offsets, and a source snapshot hash.
- Rejected or fabricated citations cannot produce a supported verdict.
- Conflicting quotations remain visible as mixed evidence.
- A reviewer can disagree, add context, save locally, and export Markdown or JSON.
- Exported evidence can be checked independently with the included verifier.

Exact matching verifies provenance within the supplied text, **not factual truth**. Semantic classification, suggested revisions, and source credibility require human review. SHA-256 fingerprints detect changes relative to an exported hash; they are not signatures or proof that a website published the text.

## Quick start

### Ready-to-run portable release

The prepared portable release requires only Node.js 22.13+. Extract the release ZIP, enter its `portable` folder, and run `node server.mjs` (or double-click `START.cmd` on Windows with Node on PATH). Open `http://127.0.0.1:5173`. There is no dependency installation. The frontend and API use the same application code as the framework build. Set `HOST=0.0.0.0` and `PORT` when deploying behind an HTTPS reverse proxy. A Dockerfile is included in the portable folder.

To rebuild this release from source after installing dependencies: `pnpm build:portable`. Output defaults to `outputs/traceproof/portable`. Behind an HTTPS reverse proxy, set `PUBLIC_ORIGIN=https://your-demo.example` to the actual external origin so same-origin requests validate correctly. Do not expose an owner-funded API key on an unrestricted public endpoint: use hosting access controls for judges and provider spending limits.

### Develop from source

Requirements: Node.js 22.13+ and pnpm 11.25.0. The UI, code, and submission materials are in English.

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The sample works without any accounts. Select **New review → Use sample inputs** to reuse the same source material in a genuine live run. Or paste your own document (20–12,000 characters), add up to six source notes, and select **Run evidence review**.

The `pnpm-workspace.yaml` uses a checkout-local store and a hoisted linker for portable Windows installs. A clean installation may take several minutes.

## Connect Nebius and Tavily

1. Obtain a Nebius Token Factory API key from your own account. Check credits and model availability.
2. Open **Connections** and paste the Nebius key. It stays in this tab's memory; reloading clears it.
3. Optionally add a Tavily key and enable **Research the web**.
4. Run a review. A successful result is labelled **Live Nebius run** and has actual provider call/token counts in **Run trace**.

For server-managed deployment, configure these environment variables as secrets through your hosting provider. The supplied `.env.example` documents the names. Local framework environment loading follows the normal `.env.local` convention.

```text
NEBIUS_API_KEY=your-key
TAVILY_API_KEY=optional-key
NEBIUS_MODEL=nvidia/nemotron-3-super-120b-a12b
```

Never commit actual keys. The application never saves keys in localStorage, source snapshots, reports, or logs. Browser-supplied credentials transit the application server and are used only for the requested provider calls. Use HTTPS for deployed applications. A hosted server key makes calls chargeable to the project owner; protect access and configure provider spend limits before enabling it for a public audience.

## NVIDIA and Nebius integration

The live pipeline makes two runtime calls to the Nebius Token Factory chat completions endpoint:

`https://api.tokenfactory.us-central1.nebius.com/v1/chat/completions`

The default model is **NVIDIA Nemotron 3 Super 120B A12B**, ID `nvidia/nemotron-3-super-120b-a12b`. We selected a reasoning-oriented model for nuanced qualifiers, exclusions, and conflicts. This is a design rationale, not a measured claim that it outperforms other models. The same model handles extraction and evidence assessment; the project does not claim multi-model routing, fine-tuning, dedicated GPUs, or Nebius compute deployment.

The OpenAI-compatible API shape allows a thin `fetch` adapter with structured JSON requests. Token Factory removes the need to provision inference hardware for this prototype. Actual workflow acceleration, response quality, latency and costs should be reported only after live testing.

Tavily is an optional **functional runtime integration**: one advanced search per selected claim, at most five via the UI (six in the API), three results per search. Raw page text is preferred; when unavailable the report explicitly labels the source as an excerpt. Duplicate URLs are removed. Input and retrieval caps bound context size and provider use.

## Architecture

```text
React workbench
    → POST /api/audit (streaming NDJSON)
    → Nemotron on Nebius: select exact claims
    → optional Tavily: retrieve source snapshots
    → Nemotron on Nebius: compare claims with sources
    → deterministic quote + source + offset validation
    → human review → Markdown / JSON evidence bundle
```

The app uses React, TypeScript, Vinext/Vite and a Cloudflare Worker-compatible server through the Sites starter. UI state is browser-scoped. Only clicking **Save** persists a report and reviewer notes on the current device; up to ten are retained. There is no shared database or server-side document storage in this prototype.

Main implementation:

| File | Responsibility |
| --- | --- |
| `app/workbench.tsx` | Review workflow, source inspection, settings, notes, exports |
| `app/api/audit/route.ts` | Bounded request parsing, same-origin guard, progress stream |
| `lib/audit.mjs` | Runtime Nebius/Tavily orchestration and token accounting |
| `lib/evidence.mjs` | Exact-span validation, hashes, verdict grounding, exports |
| `lib/sample.mjs` | Clearly labelled fictional sample |
| `tests/evidence.test.mjs` | Adversarial grounding and mocked provider contracts |
| `scripts/verify-report.mjs` | Independent export consistency check |

## Verify and build

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
node scripts/verify-report.mjs traceproof-review.json
```

Tests cover invented citations, unknown sources, conflicts, duplicate citations, absent model reviews, paraphrased claim rejection, input limits, unsafe URL schemes, invalid JSON, credential failures, source hashing, token accounting, and actual request construction for both providers using controlled mocks. These tests do not establish live model accuracy.

## Judge walkthrough

### Evidence desk design

The forensic editorial interface links each numbered claim to a verbatim quote, its source snapshot and a separate human decision. Pine surfaces, paper dossiers, lime verification marks, coral contradictions and amber gaps distinguish the evidence states without relying on color alone. Source sheets highlight the exact character range and show snapshot provenance and SHA-256. On phones, evidence opens inline beneath the selected claim and source inspection fills the screen. Motion respects `prefers-reduced-motion`.

The sample is hand-authored and never displays invented AI confidence or performance. Run trace distinguishes the sample from actual recorded provider calls. Human decisions and notes remain separate from model findings in both exports.

1. Open the app and inspect the clearly labelled sample.
2. Select the SSO claim: the source restricts it to Enterprise.
3. Select the backup claim: active deletion and backup retention differ.
4. Select uptime: no decisive evidence, with a specific follow-up question.
5. Inspect a full source snapshot; add a reviewer note and judgement.
6. Export the JSON and verify it locally.
7. For live evaluation, run with project-funded credentials configured by the submitter. Judges must not be required to buy credits.

## Known limits

This is a focused prototype, not a certification system. The model selects up to five claims in the UI and may miss others. Source snapshots are bounded and can be incomplete, stale, inaccurate, or adversarial. Prompt isolation reduces but does not eliminate prompt injection. The exact matcher deliberately rejects normalized or paraphrased citations. There are no automatic retries, automated factual benchmarks, independent source credibility scoring, collaborative accounts, PDF parsing, or guaranteed live-provider compatibility without an account test. A disconnected browser may leave an already-started provider request running.

For production: add authenticated projects and durable rate limits, stronger source provenance and access controls, independent model evaluation, request cancellation, and a larger human-labelled benchmark.

## Credits and submission integrity

Developed with assistance from OpenAI Codex for product design, implementation, testing, and draft documentation. The submitter must review and understand the work, accurately disclose AI assistance, and supply their own eligibility and experience statements. OrbitNote and all sample policies are fictional. No third-party logos, photos, music, or copied project branding are required. Dependencies retain their own licenses; the MIT license covers original project code.

Reference documentation: [Nebius Nemotron integration](https://nebius.com/services/token-factory/nemotron), [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search), [hackathon official rules](https://nebiusglobalaihackathon.devpost.com/rules), [Devpost community guidelines](https://info.devpost.com/legal/community-guidelines).
