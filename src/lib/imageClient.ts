import type { ImageOptions } from './types';
import { supabase } from './supabase';

export type GenerateImageResult = {
  url: string;
  isDemo: boolean;
};

/**
 * Build a Pollinations image URL from a prompt and options.
 * Pollinations generates an actual AI image from the text prompt,
 * so "sunset over the ocean" returns a sunset image, not a random photo.
 */
function buildPollinationsUrl(prompt: string, options: ImageOptions): string {
  const enhanced = `${prompt}, ${options.style.toLowerCase()}, ${options.mood.toLowerCase()} mood, high detail, professional`;
  const encoded = encodeURIComponent(enhanced);

  let width = 1024;
  let height = 1024;
  if (options.aspectRatio.includes('16:9')) {
    width = 1280;
    height = 720;
  } else if (options.aspectRatio.includes('4:5')) {
    width = 800;
    height = 1000;
  }

  const seed = Math.floor(Math.random() * 1000000);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
}

/**
 * Reusable AI image generation function.
 *
 * If an image-generation API key is configured on the server (via the
 * `generate-image` edge function), the request is proxied securely through
 * that function so no API key is ever exposed to the browser.
 *
 * If no API is configured, falls back to Pollinations AI which generates
 * real images from the prompt (free, no key required).
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
    // Fallback: Pollinations AI generates real images from the prompt (no key needed).
    return {
      url: buildPollinationsUrl(prompt, options),
      isDemo: true,
    };
  }
}
