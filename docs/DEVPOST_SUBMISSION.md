# Devpost submission draft — TraceProof

Status: copy-ready project description plus explicitly unresolved fields. This draft is not a completed hackathon entry. Do not replace factual gaps with invented ratings or claims of live inference.

## Project name

TraceProof

## Elevator pitch

An evidence review agent that traces claims to exact source quotes, catches contradictions, and gives teams a decision record they can inspect.

## About the project

### Inspiration

A vendor summary can sound convincing while quietly losing the conditions that matter. “SSO is included” may mean Enterprise only. “Deleted in 24 hours” may exclude backups. Small teams need to see those distinctions before turning a summary into a decision.

TraceProof was built around a simple product principle: a useful AI finding should leave an inspectable trail from the claim to the source, and give a reviewer room to disagree.

### What it does

TraceProof turns a document and its supporting source notes into a claim-by-claim review. It separates supported claims, contradictions, conflicting evidence, and evidence gaps. Each accepted citation links to the exact source text and character span. The reviewer can inspect a source snapshot, record a judgement, add a note, and export a Markdown report or a structured JSON evidence bundle.

The built-in example uses a fictional vendor called OrbitNote. It makes plan restrictions, data residency conditions, backup retention, and an unsupported uptime promise easy to inspect. The example is explicitly labelled as hand-authored and uses no model calls.

### How we built it

The live path uses NVIDIA Nemotron 3 Super through the Nebius Token Factory inference API. One model call extracts claims as exact substrings of the document; a second compares them with the evidence set. Optional Tavily runtime searches retrieve additional sources for the selected claims.

A separate deterministic layer checks source IDs, exact quote matches, and character offsets. Unsupported citations are rejected before a verdict is assigned. Source snapshots receive SHA-256 fingerprints. The export includes model identity, provider-reported usage, run stages, source text, and reviewer notes.

The workbench uses React and TypeScript with a Vinext/Vite server. It streams progress, supports browser-local saved reviews, and exports reports without credentials. The same core evidence functions power the sample, the live path, and automated tests.

### Challenges we addressed

The central challenge was keeping citation presence separate from interpretation. A quote can be authentic and still be misunderstood. TraceProof therefore labels exact matching as a provenance check, preserves conflicting evidence, and leaves semantic judgement with the reviewer.

Another challenge was incomplete evidence. The product retains an explicit evidence-gap state and asks a concrete follow-up question instead of filling the gap with confident prose. Strict matching also makes failures visible: a paraphrased or invented quotation is rejected.

### What we learned from the implementation

The architecture demonstrates why model reasoning and mechanical validation belong in different parts of a review system. Model output can propose a relationship; code can check whether the quoted text actually exists. A useful handoff also needs source snapshots, uncertainty, and human notes.

The submitter should add their own learning experience here after running and reviewing the project. No live quality, latency, or user-impact result is claimed in this draft.

### What is next

Run a labelled set of real vendor-review cases, compare model variants on scope errors and abstention, improve source freshness handling, and add collaborative review with explicit access controls.

## Built with — suggested tags

TypeScript, JavaScript, React, Node.js, NVIDIA Nemotron, Nebius Token Factory, Tavily, Vite, Vinext, Cloudflare Workers, SHA-256, HTML, CSS

Only keep infrastructure tags actually used in the final deployed version. Do not add Nebius AI Cloud, GPU instances, fine-tuning, or serverless jobs unless subsequently used.

## Try it out / repository / video

- Working demo: add the verified judge-accessible deployment URL.
- Public repository: add the actual public GitHub/GitLab/Bitbucket repository URL with MIT license and README.
- Video: add a **public YouTube** URL under three minutes. The official rules specify YouTube/public even though the generic form accepts Vimeo/unlisted.

## Additional fields

| Form field | Answer / required action |
| --- | --- |
| Submitter type | Submitter must identify Individual / Team / Organization. |
| Organization | Actual organization, or N/A. |
| Country of residence | Submitter must provide actual residence; do not infer from timezone. |
| Canadian province | Actual province if applicable; otherwise N/A. |
| Track | Best apps and agents |
| New or existing before August 26, 2026 | New — this code was authored during this build on October 28, 2026 local time. |
| Existing-project updates | N/A |
| Model and rationale | Configured: nvidia/nemotron-3-super-120b-a12b, selected for evidence comparison involving scope, conditions, and contradiction. Confirm the actual model from a successful live run before saying “used.” |
| Nemotron quality rating | Not yet measured. Run the evaluation procedure before selecting a 1–10 rating. |
| Fine-tuning / prompting | Prompt engineering: untrusted data delimiters, explicit JSON schemas, exact-substring extraction, bounded source-only comparison, and deterministic post-validation. No fine-tuning. |
| Compared with other models | No controlled comparison has been conducted. Do not claim superiority or invent benchmark numbers. |
| Valuable Nebius capabilities | The implemented integration uses the Token Factory OpenAI-compatible inference API. No GPU instance was provisioned. Describe observed setup and runtime experience after a live test. |
| Recommend Nebius, 1–10 | Submitter to rate after using the service. |
| Inference experience, 1–10 | Submitter to rate after live runs. |
| Additional features desired | Product suggestions: schema-valid output guarantees, per-request reasoning/token controls, better per-key spend caps, and structured usage/latency diagnostics. These are suggestions, not assertions that the platform currently lacks every feature. |
| Hopes for Nemotron team | Stronger evidence-scope reasoning, reliable abstention, and public evaluations for contradictory and multilingual source material. |
| Tavily used? | Select Yes only after a successful runtime Tavily call. Integration code alone does not qualify. |
| Builders & Brews city | Only the city actually attended; otherwise leave unset. |
| Age of majority / no disqualifying affiliation | The submitter and every teammate must confirm personally. These declarations have not been made by the assistant. |
| AI tools used | OpenAI Codex assisted with product design, source code, tests, and documentation. Add NVIDIA Nemotron on Nebius after actual runtime use. Disclose any other tools used. |
| Learning level | Submitter to choose based on their actual participation. |
| Career value | Submitter to answer from their actual experience. |

## Submission completion gates

1. Create a Nebius account, obtain permitted credits, and complete at least one successful live review. Save its exported run receipt.
2. Optional Tavily prize: configure Tavily, run with web research, and confirm `tavilyCalls > 0` in the live export.
3. Test the actual public demo as a judge without personal paid API keys. Configure project-funded access and keep it working through the judging period.
4. Publish the complete source repository, license, and setup instructions.
5. Record the real application, including a live provider run; upload a public YouTube video shorter than three minutes.
6. Fill ratings, feedback, residence, participation, and eligibility declarations truthfully.
7. Review and submit before **October 30, 2026, 10:00 PDT = 22:00 Asia/Qyzylorda**. Keep the working project available through **December 15, 2026, 12:00 PST = December 16, 01:00 Asia/Qyzylorda**.

Rules checked at https://nebiusglobalaihackathon.devpost.com/rules . The official rules take precedence over generic form text. Final submission and contractual declarations remain for the human entrant.
