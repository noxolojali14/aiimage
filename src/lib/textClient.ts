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
  // Build a combined instruction: system prompt + user request.
  const instruction = language
    ? `${systemPrompt}\n\nProgramming language: ${language}\nTask: ${prompt}`
    : `${systemPrompt}\n\n${prompt}`;

  const url = `https://text.pollinations.ai/${encodeURIComponent(instruction)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Text API returned ${res.status}`);
    }

    const text = await res.text();

    if (text && text.trim().length > 20) {
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
