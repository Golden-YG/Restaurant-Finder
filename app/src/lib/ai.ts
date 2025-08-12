import { RequirementAnalysis, Restaurant, Subratings } from '@/types';
import { getOpenAIClient } from './openai';

export async function analyzeRequirement(userQuery: string): Promise<RequirementAnalysis> {
  const client = getOpenAIClient();
  const system = `You extract structured constraints from a user's restaurant request and provide a brief rationale. Do not reveal chain-of-thought or step-by-step reasoning. Provide a concise summary only.`;
  const user = `User request: ${userQuery}\nReturn JSON with: reasoningSummary (<= 60 words) and extractedConstraints with fields: cuisinePreferences[], ambiancePreferences[], priceCeiling (number|null), dietaryNeeds[], occasion, noiseLevel(one of quiet|moderate|lively|null), mustHaves[], avoid[], otherNotes[], keywords[].`;
  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    max_output_tokens: 600,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'RequirementAnalysis', schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        reasoningSummary: { type: 'string' },
        extractedConstraints: {
          type: 'object',
          additionalProperties: true,
          properties: {
            cuisinePreferences: { type: 'array', items: { type: 'string' } },
            ambiancePreferences: { type: 'array', items: { type: 'string' } },
            priceCeiling: { type: ['number', 'null'] },
            dietaryNeeds: { type: 'array', items: { type: 'string' } },
            occasion: { type: ['string', 'null'] },
            noiseLevel: { type: ['string', 'null'] },
            mustHaves: { type: 'array', items: { type: 'string' } },
            avoid: { type: 'array', items: { type: 'string' } },
            otherNotes: { type: 'array', items: { type: 'string' } },
            keywords: { type: 'array', items: { type: 'string' } },
          },
          required: [],
        },
      },
      required: ['reasoningSummary', 'extractedConstraints'],
    } } },
  });
  const jsonText = (response as any).output_text as string;
  return JSON.parse(jsonText) as RequirementAnalysis;
}

export async function scoreRestaurantsAgainstRequirement(
  requirement: RequirementAnalysis,
  candidates: Restaurant[],
): Promise<Restaurant[]> {
  const client = getOpenAIClient();
  const system = `You are an expert reviewer that scores restaurants against a user's constraints. Output only JSON; no chain-of-thought.`;
  const user = `Constraints: ${JSON.stringify(requirement.extractedConstraints)}\n\nCandidates: ${JSON.stringify(
    candidates.map((c) => ({
      placeId: c.placeId,
      name: c.name,
      googleRating: c.googleRating,
      googleUserRatingsTotal: c.googleUserRatingsTotal,
      priceLevel: c.priceLevel,
      openingHours: c.openingHours,
      reviews: c.reviews?.slice(0, 10) ?? [],
    })),
  )}\n\nReturn JSON array of objects: { placeId, aiRating (1.0-5.0), subratings: { environment(1-5), foodQuality(1-5), service(1-5), price(number avg spend) }, adjectives: { environment: [{adjective, count}], food: [...], service: [...] } }. Use specific adjectives (e.g., fresh, quiet, cozy, smoky, greasy, prompt, inattentive).`;

  const response = await client.responses.create({
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    max_output_tokens: 4000,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
  });

  const jsonText = (response as any).output_text as string;
  let scored: Array<{
    placeId: string;
    aiRating: number;
    subratings: Subratings;
    adjectives: Restaurant['adjectives'];
  }> = [];
  try {
    scored = JSON.parse(jsonText);
  } catch {}

  const byId = new Map(scored.map((s) => [s.placeId, s]));
  return candidates.map((c) => {
    const s = byId.get(c.placeId);
    if (!s) return c;
    return {
      ...c,
      aiRating: typeof s.aiRating === 'number' ? s.aiRating : null,
      subratings: s.subratings ?? null,
      adjectives: s.adjectives ?? null,
    };
  });
}