import type {
  ContentType,
  CodeLanguage,
  ImageStyle,
  ImageMood,
  ImageQuality,
  ImageSize,
} from './types';

export const CONTENT_TYPES: {
  id: ContentType;
  label: string;
  icon: string;
  description: string;
}[] = [
  { id: 'blog', label: 'Blog Post', icon: 'FileText', description: 'Engaging articles and posts' },
  { id: 'email', label: 'Professional Email', icon: 'Mail', description: 'Polished business emails' },
  { id: 'social', label: 'Social Media Post', icon: 'Share2', description: 'Scroll-stopping social posts' },
  { id: 'ad', label: 'Advertisement', icon: 'Megaphone', description: 'Persuasive ad copy' },
  { id: 'product', label: 'Product Description', icon: 'Package', description: 'Selling product descriptions' },
  { id: 'code', label: 'Code', icon: 'Code2', description: 'Clean code in 7 languages' },
  { id: 'image', label: 'AI Image', icon: 'Image', description: 'Unique AI-generated images' },
];

export const CODE_LANGUAGES: CodeLanguage[] = [
  'Python',
  'JavaScript',
  'HTML',
  'CSS',
  'Java',
  'C#',
  'SQL',
];

export const IMAGE_STYLES: ImageStyle[] = [
  'Realistic Photography',
  'Digital Art',
  'Cartoon',
  '3D Render',
  'Watercolour',
  'Illustration',
  'Anime',
  'Cinematic',
  'Minimalist',
  'Professional',
  'Artistic',
];

export const IMAGE_MOODS: ImageMood[] = [
  'Bright',
  'Calm',
  'Energetic',
  'Professional',
  'Dramatic',
  'Romantic',
  'Happy',
  'Mysterious',
  'Creative',
];

export const IMAGE_SIZES: ImageSize[] = [
  'Square — 1:1',
  'Landscape — 16:9',
  'Portrait — 4:5',
  'Wide — 16:9',
];

export const IMAGE_QUALITIES: ImageQuality[] = ['Standard', 'High Quality'];
