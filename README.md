# ai-content-workflow ⚙️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Article](https://img.shields.io/badge/Deep_Dive-Read_Post-10b981)](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

A multi-step, schema-enforced AI editorial pipeline built on the **Vercel AI SDK** (`generateObject` + `generateText`) and **Zod**.

> 📖 **Read the full engineering breakdown:** [Building Custom MCP Servers in TypeScript for Cursor](https://www.zaynelovecraft.com/articles/building-custom-mcp-servers-typescript-youtube-skills)

Instead of one-shotting an LLM prompt and getting generic slop, this pipeline splits publishing into three deterministic stages with a strict quality gate:

```text
[Topic + Audience]
       │
       ▼
1. planArticleBrief()     ──► Zod-validated title (<=65c), meta (<=160c), outline & FAQ schema
       │
       ▼
2. draftArticleMarkdown() ──► Grounded technical prose with anti-slop system constraints
       │
       ▼
3. verifyArticleQuality() ──► Automated editorial critic (flags filler phrases + scores 0-100)
```

## Usage

```typescript
import {
  planArticleBrief,
  draftArticleMarkdown,
  verifyArticleQuality,
} from "./src/pipeline.js";

const brief = await planArticleBrief(
  "Next.js 16 Partial Prerendering vs ISR Trade-offs",
  "Senior full-stack engineers"
);

const markdown = await draftArticleMarkdown(brief);
const audit = await verifyArticleQuality(markdown, brief);

if (!audit.passed) {
  throw new Error(`Draft rejected (${audit.score}/100): ${audit.aiSlopDetected.join(", ")}`);
}
```

## License

MIT
