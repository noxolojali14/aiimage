import type { ImageOptions } from './types';
import { generateDemoImageUrl } from './demo';
import { supabase } from './supabase';

export type GenerateImageResult = {
  url: string;
  isDemo: boolean;
};

/**
 * Reusable AI image generation function.
 *
 * If an image-generation API key is configured on the server (via the
 * `generate-image` edge function), the request is proxied securely through
 * that function so no API key is ever exposed to the browser.
 *
 * If no API is configured, the function falls back to a clearly-labelled
 * Demo Image Generation Mode that returns a placeholder image. Demo images
 * are never presented as real AI output.
 */
export async function generateAIImage(
  prompt: string,
  options: ImageOptions
): Promise<GenerateImageResult> {
  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? anonKey;

  try {
    const res = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        prompt,
        style: options.style,
        mood: options.mood,
        quality: options.quality,
        aspectRatio: options.aspectRatio,
      }),
    });

    if (!res.ok) {
      throw new Error(`Edge function returned ${res.status}`);
    }

    const data = (await res.json()) as { url?: string; isDemo?: boolean; error?: string };

    if (data.error) {
      throw new Error(data.error);
    }

    if (typeof data.url === 'string') {
      return { url: data.url, isDemo: data.isDemo ?? true };
    }

    throw new Error('No image URL returned');
  } catch {
    // Fallback to demo mode if the edge function is not deployed or errors.
    return {
      url: generateDemoImageUrl(prompt, options.aspectRatio),
      isDemo: true,
    };
  }
}
