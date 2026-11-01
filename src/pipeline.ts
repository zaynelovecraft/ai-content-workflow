import { generateObject, generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const ArticleBriefSchema = z.object({
  title: z.string().min(20).max(65),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  metaDescription: z.string().min(80).max(160),
  primaryEntity: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      keyTakeaway: z.string(),
      requiredCodeOrTable: z.boolean(),
    })
  ),
  faq: z.array(
    z.object({
      question: z.string(),
      conciseAnswer: z.string(),
    })
  ),
});

export type ArticleBrief = z.infer<typeof ArticleBriefSchema>;

export const QualityGateSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  aiSlopDetected: z.array(z.string()),
  missingEntities: z.array(z.string()),
  revisedMetaDescription: z.string().optional(),
});

/**
 * Step 1: Generate a strictly-typed editorial brief & FAQ schema plan.
 */
export async function planArticleBrief(topic: string, targetAudience: string): Promise<ArticleBrief> {
  const { object } = await generateObject({
    model: anthropic("claude-3-7-sonnet-latest"),
    schema: ArticleBriefSchema,
    prompt: `Create a high-signal technical article brief for topic: "${topic}".
Target audience: ${targetAudience}.
Enforce concrete engineering trade-offs, zero fluff, and citable FAQ answers.`,
  });
  return object;
}

/**
 * Step 2: Draft the Markdown article from the approved brief.
 */
export async function draftArticleMarkdown(brief: ArticleBrief): Promise<string> {
  const { text } = await generateText({
    model: anthropic("claude-3-7-sonnet-latest"),
    system:
      "You are a principal engineer writing direct, technical prose. Never use phrases like 'In today's fast-paced world', 'delve', or 'tapestry'. Include runnable code or concrete numbers in every section.",
    prompt: `Write the complete Markdown article following this brief:\n\n${JSON.stringify(brief, null, 2)}`,
  });
  return text;
}

/**
 * Step 3: Run an automated editorial & SEO quality gate before publishing.
 */
export async function verifyArticleQuality(markdown: string, brief: ArticleBrief) {
  const { object } = await generateObject({
    model: anthropic("claude-3-7-sonnet-latest"),
    schema: QualityGateSchema,
    prompt: `Audit this Markdown draft against its brief (${brief.primaryEntity}). Flag any generic AI filler phrases and score 0-100:\n\n${markdown}`,
  });
  return object;
}
