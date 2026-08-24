import type { ContentType, CodeLanguage } from './types';

export type PromptTemplate = {
  id: string;
  label: string;
  icon: string;
  description: string;
  build: (vars: Record<string, string>) => string;
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'blog',
    label: 'Blog Post',
    icon: 'FileText',
    description: 'Write a structured, SEO-friendly blog post on any topic.',
    build: (v) =>
      `You are an expert content writer.\n\nWrite a well-structured blog post about:\n${v.topic || '{topic}'}\n\nTone: ${v.tone || 'informative and engaging'}\nAudience: ${v.audience || 'general readers'}\nLength: ${v.length || '600–800 words'}\n\nInclude a compelling title, an introduction, clear headings, and a conclusion.`,
  },
  {
    id: 'email',
    label: 'Professional Email',
    icon: 'Mail',
    description: 'Compose a clear, professional email for any business situation.',
    build: (v) =>
      `You are an expert business communicator.\n\nWrite a professional email about:\n${v.topic || '{topic}'}\n\nRecipient: ${v.recipient || 'a colleague'}\nTone: ${v.tone || 'professional and courteous'}\nKey points to include: ${v.points || '{key points}'}\n\nInclude a subject line, greeting, body, and sign-off.`,
  },
  {
    id: 'social',
    label: 'Social Media Post',
    icon: 'Share2',
    description: 'Create engaging, shareable social media content with hashtags.',
    build: (v) =>
      `You are a social media expert.\n\nCreate a ${v.platform || 'social media'} post about:\n${v.topic || '{topic}'}\n\nTone: ${v.tone || 'engaging and friendly'}\nInclude relevant hashtags and a call to action.\nLength: ${v.length || 'concise'}`,
  },
  {
    id: 'ad',
    label: 'Advertisement',
    icon: 'Megaphone',
    description: 'Write persuasive ad copy that converts.',
    build: (v) =>
      `You are an expert copywriter.\n\nWrite persuasive advertisement copy for:\n${v.product || '{product/service}'}\n\nTarget audience: ${v.audience || '{audience}'}\nKey benefit: ${v.benefit || '{key benefit}'}\nTone: ${v.tone || 'persuasive and energetic'}\n\nInclude a headline, body, and a strong call to action.`,
  },
  {
    id: 'product',
    label: 'Product Description',
    icon: 'Package',
    description: 'Craft product descriptions that highlight benefits and sell.',
    build: (v) =>
      `You are an e-commerce copywriting expert.\n\nWrite a product description for:\n${v.product || '{product}'}\n\nFeatures: ${v.features || '{features}'}\nTarget audience: ${v.audience || '{audience}'}\nTone: ${v.tone || 'enticing and informative'}\n\nHighlight benefits, include a short bullet list, and end with a call to action.`,
  },
  {
    id: 'code',
    label: 'Code Generator',
    icon: 'Code2',
    description: 'Generate clean, well-commented code in 7 programming languages.',
    build: (v) =>
      `You are an expert software engineer.\n\nWrite ${v.language || '{language}'} code for:\n${v.task || '{task}'}\n\nRequirements:\n- Clean, readable, and well-commented\n- Follow best practices for ${v.language || 'the language'}\n- Include example usage where helpful`,
  },
  {
    id: 'image',
    label: 'Image Generator',
    icon: 'Image',
    description: 'Create detailed AI image prompts for realistic, artistic and creative visuals.',
    build: (v) =>
      `You are an expert AI image prompt designer.\n\nCreate a detailed image based on the following description:\n${v.image_description || '{image_description}'}\n\nStyle:\n${v.style || '{style}'}\n\nMood:\n${v.mood || '{mood}'}\n\nComposition:\nCreate a visually balanced composition with clear subject placement.\n\nQuality:\n${v.quality || '{quality}'}\n\nAspect Ratio:\n${v.aspect_ratio || '{aspect_ratio}'}\n\nMake the image visually appealing, detailed and suitable for the user's intended purpose.`,
  },
];

export function buildPrompt(
  contentType: ContentType,
  vars: Record<string, string>
): string {
  const template = PROMPT_TEMPLATES.find((t) => t.id === contentType);
  return template ? template.build(vars) : '';
}

export function buildImagePrompt(vars: {
  image_description: string;
  style: string;
  mood: string;
  quality: string;
  aspect_ratio: string;
}): string {
  const template = PROMPT_TEMPLATES.find((t) => t.id === 'image');
  return template ? template.build(vars) : '';
}

export function buildCodePrompt(language: CodeLanguage, task: string): string {
  const template = PROMPT_TEMPLATES.find((t) => t.id === 'code');
  return template ? template.build({ language, task }) : '';
}
