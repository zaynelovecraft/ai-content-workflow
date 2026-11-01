#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { draftArticleMarkdown, planArticleBrief, verifyArticleQuality } from "./pipeline.js";

const [topic, audience = "Senior full-stack engineers"] = process.argv.slice(2);

if (!topic || topic === "--help" || topic === "-h") {
  console.log(`Usage: ai-content-workflow "<topic>" ["<audience>"]

Env:
  ANTHROPIC_API_KEY   required
  ANTHROPIC_MODEL     optional, defaults to claude-sonnet-4-5
  OUTPUT_DIR          optional, defaults to ./output`);
  process.exit(topic ? 0 : 1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set. Get one at https://console.anthropic.com/");
  process.exit(1);
}

console.log("1/3 Planning brief...");
const brief = await planArticleBrief(topic, audience);
console.log(`    "${brief.title}" (${brief.sections.length} sections, ${brief.faq.length} FAQs)`);

console.log("2/3 Drafting article...");
const markdown = await draftArticleMarkdown(brief);

console.log("3/3 Running quality gate...");
const audit = await verifyArticleQuality(markdown, brief);

const outDir = path.resolve(process.env.OUTPUT_DIR ?? "output");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${brief.slug}.md`);
const frontmatter = `---\ntitle: ${JSON.stringify(brief.title)}\ndescription: ${JSON.stringify(
  audit.revisedMetaDescription ?? brief.metaDescription
)}\n---\n\n`;
fs.writeFileSync(outFile, frontmatter + markdown);
fs.writeFileSync(path.join(outDir, `${brief.slug}.audit.json`), JSON.stringify(audit, null, 2));

console.log(`\nScore: ${audit.score}/100 (${audit.passed ? "passed" : "failed"})`);
if (audit.aiSlopDetected.length) console.log(`Flagged phrases: ${audit.aiSlopDetected.join(", ")}`);
console.log(`Saved ${outFile}`);
process.exit(audit.passed ? 0 : 2);
