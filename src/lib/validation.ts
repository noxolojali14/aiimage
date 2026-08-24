import type { ContentType } from './types';

export type TypeLabels = Record<ContentType, string>;

export const TYPE_LABELS: TypeLabels = {
  blog: 'Blog Post',
  email: 'Professional Email',
  social: 'Social Media Post',
  ad: 'Advertisement',
  product: 'Product Description',
  code: 'Code',
  image: 'AI Image',
};

type KeywordSet = {
  type: ContentType;
  label: string;
  keywords: string[];
};

const TYPE_KEYWORDS: KeywordSet[] = [
  {
    type: 'blog',
    label: 'Blog Post',
    keywords: [
      'blog post',
      'blog article',
      'article',
      'blog',
      'write a blog',
      'seo article',
      'long form',
      'long-form',
      'feature article',
    ],
  },
  {
    type: 'email',
    label: 'Professional Email',
    keywords: [
      'email',
      'e-mail',
      'mail',
      'newsletter',
      'subject line',
      'dear',
      'regards',
      'sincerely',
      'follow up email',
      'cold email',
      'business email',
      'professional email',
    ],
  },
  {
    type: 'social',
    label: 'Social Media Post',
    keywords: [
      'social media',
      'social post',
      'instagram',
      'facebook post',
      'tweet',
      'twitter',
      'linkedin post',
      'tiktok',
      'hashtag',
      'caption',
      'social media post',
      'social media caption',
      'reel',
      'story',
    ],
  },
  {
    type: 'ad',
    label: 'Advertisement',
    keywords: [
      'ad',
      'advert',
      'advertisement',
      'ad copy',
      'advertising',
      'commercial',
      'sponsored',
      'promo',
      'promotion',
      'marketing copy',
      'paid ad',
      'google ad',
      'facebook ad',
      'ad campaign',
      'ppc',
    ],
  },
  {
    type: 'product',
    label: 'Product Description',
    keywords: [
      'product description',
      'product',
      'ecommerce',
      'e-commerce',
      'online store',
      'shopify',
      'product listing',
      'product page',
      'buy now',
      'feature list',
      'specifications',
      'product features',
    ],
  },
  {
    type: 'code',
    label: 'Code',
    keywords: [
      'code',
      'function',
      'script',
      'program',
      'algorithm',
      'python',
      'javascript',
      'java',
      'sql',
      'html',
      'css',
      'c#',
      'csharp',
      'class',
      'method',
      'api',
      'bug fix',
      'debug',
      'compile',
      'snippet',
      'developer',
      'programming',
    ],
  },
  {
    type: 'image',
    label: 'AI Image',
    keywords: [
      'image',
      'picture',
      'photo',
      'photograph',
      'illustration',
      'drawing',
      'render',
      'visual',
      'artwork',
      'painting',
      'generate an image',
      'create an image',
      'ai image',
      'graphic',
    ],
  },
];

export type ValidationResult =
  | { valid: true }
  | { valid: false; detectedType: ContentType; detectedLabel: string; selectedLabel: string };

/**
 * Checks whether the user's prompt matches the selected content type.
 * If the prompt strongly indicates a different content type, returns
 * a mismatch result so the generator can inform the user it doesn't
 * have knowledge of generating that type with the current selection.
 */
export function validatePromptType(
  selectedType: ContentType,
  prompt: string
): ValidationResult {
  const text = prompt.toLowerCase().trim();
  const selectedLabel = TYPE_LABELS[selectedType];

  // Check each content type's keywords against the prompt.
  for (const set of TYPE_KEYWORDS) {
    if (set.type === selectedType) continue;

    for (const kw of set.keywords) {
      // Use word-boundary-ish matching to avoid false positives like
      // "ad" inside "read". We check for the keyword as a standalone
      // phrase or surrounded by non-letter characters.
      const pattern = `(^|[^a-z])${escapeRegex(kw.toLowerCase())}([^a-z]|$)`;
      if (new RegExp(pattern).test(text)) {
        return {
          valid: false,
          detectedType: set.type,
          detectedLabel: set.label,
          selectedLabel,
        };
      }
    }
  }

  return { valid: true };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatMismatchMessage(result: {
  detectedLabel: string;
  selectedLabel: string;
}): string {
  return (
    `I don't have knowledge of generating ${result.detectedLabel.toLowerCase()}s ` +
    `in the ${result.selectedLabel} generator. ` +
    `Please switch to the ${result.detectedLabel} content type to generate that.`
  );
}
