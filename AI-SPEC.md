# AI-SPEC.md — Star Wars: Unlimited Deck of the Day

## 3. Framework Quick Reference

### Installation
```bash
npm install ai @ai-sdk/anthropic zod
```

### Key Imports
```typescript
import { generateText, generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
```

### Entry Point Pattern (Fetching & Summarizing Deck)
```typescript
// src/lib/ai/deck-summarizer.ts
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function summarizeDeck(deckData: any) {
  const result = await generateObject({
    model: anthropic('claude-3-5-sonnet-20241022'),
    schema: z.object({
      title: z.string(),
      summary: z.string(),
      key_combos: z.array(z.string()),
      difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    }),
    prompt: `Analyze this Star Wars: Unlimited tournament decklist: ${JSON.stringify(deckData)}`,
  });
  return result.object;
}
```

### Abstractions
| Concept | Description |
|---------|-------------|
| `generateObject` | Vercel AI SDK function to get structured, validated data from LLM. |
| `zod` | Schema validation library used to define the expected output structure. |
| `anthropic` | Provider object for accessing Claude models. |

### Pitfalls
- **Rate Limits**: `swuapi.com` is community-run; respect the `Retry-After` header.
- **API Key Scoping**: Ensure `SWUAPI_KEY` is NOT prefixed with `NEXT_PUBLIC_` to prevent leaking it to the browser.
- **Card ID Mismatches**: `swuapi.com` IDs may differ from your internal `drizzle` IDs. Always map via `set` + `number` or `name` if possible.

### Sources
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [swuapi.com API Docs](https://api.swuapi.com)
- [SWU Stats Discord (Manual Key Request)](https://swustats.net)

## 4. Implementation Guidance

### Model Choice
- **Primary**: `claude-3-5-sonnet-latest` for high-quality deck analysis and strategic summaries.
- **Alternative**: `gpt-4o-mini` if cost is a concern for daily high-volume summarization.

### Fetching Star Wars: Unlimited Tournament Data
To implement "Deck of the Day", follow this multi-step fetching strategy:

#### 1. Fetch Tournament List (Melee.gg Aggregator)
Use the `swuapi.com` endpoint to find recent Planetary Qualifiers (PQ).
```typescript
async function getRecentTournaments() {
  const response = await fetch('https://api.swuapi.com/tournaments', {
    headers: { 'Authorization': `Bearer ${process.env.SWUAPI_KEY}` }
  });
  const tournaments = await response.json();
  // Filter for 'Planetary Qualifier' in name and date within last 7 days
  return tournaments.filter(t => t.name.includes('Planetary Qualifier'));
}
```

#### 2. Fetch Top 8 Decklists
For a chosen tournament, fetch the decklists.
```typescript
async function getTop8Decklists(meleeId: string) {
  const response = await fetch(`https://api.swuapi.com/tournaments/${meleeId}/decklists`, {
    headers: { 'Authorization': `Bearer ${process.env.SWUAPI_KEY}` }
  });
  const data = await response.json();
  // Filter for standing <= 8
  return data.decklists.filter(d => d.standing <= 8);
}
```

### Context Window Strategy
- **Content**: Decklists are small (~50 cards + metadata). Even with 8 decklists, the context fits easily within Claude's 200k window.
- **Pattern**: Provide the LLM with the Top 8 lists and ask it to pick the "most interesting" or "most innovative" deck for the "Deck of the Day".

## 4b. AI Systems Best Practices

### 4b.1 Structured Outputs with Pydantic (TypeScript Zod equivalent)
Always use Zod schemas with `generateObject` to ensure the "Deck of the Day" metadata is consistently shaped for your UI.

```typescript
const DeckSummarySchema = z.object({
  deckId: z.string(),
  reasoning: z.string().describe("Why this deck was chosen for today"),
  metaCall: z.string().describe("How this deck counters the current meta"),
  difficultyRating: z.number().min(1).max(5),
});

// Implementation with Retry Logic
async function getValidatedSummary(deckData: any, retries = 3) {
  try {
    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-latest'),
      schema: DeckSummarySchema,
      prompt: `Summarize this deck: ${JSON.stringify(deckData)}`,
    });
    return object;
  } catch (error) {
    if (retries > 0) return getValidatedSummary(deckData, retries - 1);
    throw error;
  }
}
```

### 4b.2 Async-First Design
- Use `await` for background processing (e.g., in a Vercel Cron job).
- For UI responsiveness, use the `useChat` or `useCompletion` hooks from Vercel AI SDK if the summary is generated on-demand.
- **Pitfall**: Avoid long-running AI calls in the main request thread of a Next.js page; move them to a Server Action or Route Handler with high `maxDuration`.

### 4b.3 Prompt Engineering Discipline
- **System Prompt**: "You are a competitive Star Wars: Unlimited expert. Your goal is to analyze tournament decklists and identify high-performing, innovative strategies."
- **Few-Shot**: Provide 1-2 examples of a "Great Summary" vs a "Poor Summary" in the system prompt to anchor the quality.

### 4b.4 Context Window Management
- **RAG for Cards**: If the LLM needs detailed card text, don't pass the whole database. Create a mini-context by fetching card details for only the cards present in the decklist being analyzed.

### 4b.5 Cost and Latency Budget
- **Cost**: A single `claude-3-5-sonnet` call for a deck summary costs ~$0.01–$0.02.
- **Caching**: Store the "Deck of the Day" in your Neon database (`DeckOfTheDay` table). Generate it once per day via Cron and serve it to all users from the DB. Never generate the same summary twice.
