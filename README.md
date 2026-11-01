# ai-content-workflow ⚙️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Article](https://img.shields.io/badge/Deep_Dive-Read_Post-10b981)](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

A three-step AI writing pipeline built on the **Vercel AI SDK** and **Zod**. Instead of one big prompt, it plans a typed brief, drafts from that brief, then runs a separate critic that scores the draft and flags filler phrases before anything gets published.

> 📖 **Engineering write-up:** [Building Custom MCP Servers in TypeScript for Cursor](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

```text
[Topic + Audience]
       │
       ▼
1. planArticleBrief()     ──► Zod-validated title (20–65 chars), meta (80–160 chars), outline & FAQ
       │
       ▼
2. draftArticleMarkdown() ──► Markdown draft with anti-filler system rules
       │
       ▼
3. verifyArticleQuality() ──► Critic: pass/fail, 0–100 score, flagged phrases
```

## Requirements

- Node.js 18 or newer
- An Anthropic API key ([get one here](https://console.anthropic.com/)). Each run makes 3 model calls.

## Quick start

```bash
git clone https://github.com/zaynelovecraft/ai-content-workflow.git
cd ai-content-workflow
npm install                         # also compiles to dist/

export ANTHROPIC_API_KEY=sk-ant-...
npm start -- "Next.js Partial Prerendering vs ISR" "Senior full-stack engineers"
```

Output:

```text
1/3 Planning brief...
2/3 Drafting article...
3/3 Running quality gate...

Score: <0-100>/100 (passed)
Saved output/<slug>.md
```

Each run writes two files to `output/`:

- `<slug>.md`: the article with `title` and `description` frontmatter
- `<slug>.audit.json`: the critic's score, flagged phrases, and missing topics

The command exits with code `2` if the draft fails the quality gate, so you can use it in scripts or CI.

## Configuration

| Env var | Default | What it does |
|---------|---------|--------------|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic key |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5` | Any Anthropic model ID |
| `OUTPUT_DIR` | `./output` | Where articles and audits are saved |

## Use it as a library

```typescript
import {
  planArticleBrief,
  draftArticleMarkdown,
  verifyArticleQuality,
} from "./dist/pipeline.js";

const brief = await planArticleBrief("Next.js Partial Prerendering vs ISR", "Senior full-stack engineers");
const markdown = await draftArticleMarkdown(brief);
const audit = await verifyArticleQuality(markdown, brief);

if (!audit.passed) {
  throw new Error(`Draft rejected (${audit.score}/100): ${audit.aiSlopDetected.join(", ")}`);
}
```

To swap providers, replace `@ai-sdk/anthropic` in `src/pipeline.ts` with any other AI SDK provider (for example `@ai-sdk/openai`).

## License

MIT
