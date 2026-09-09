/**
 * AI text generation client.
 *
 * Uses the Pollinations AI text endpoint (free, no API key required) to
 * generate real content from the user's prompt. Falls back to the local
 * demo generator only if the network call fails entirely.
 */
import { generateDemoContent } from './demo';
import type { ContentType, CodeLanguage } from './types';

type GenerateTextParams = {
  type: ContentType;
  prompt: string;
  systemPrompt: string;
  language?: CodeLanguage;
};

export async function generateAIText({
  type,
  prompt,
  systemPrompt,
  language,
}: GenerateTextParams): Promise<{ text: string; isDemo: boolean }> {
  const userPrompt = language
    ? `Programming language: ${language}\n\nTask: ${prompt}`
    : prompt;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      throw new Error(`Text API returned ${res.status}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;

    if (text && text.trim().length > 0) {
      return { text: text.trim(), isDemo: false };
    }

    throw new Error('Empty response from text API');
  } catch {
    // Last-resort fallback: local demo template so the user still sees something.
    return {
      text: generateDemoContent(type, prompt, language),
      isDemo: true,
    };
  }
}
