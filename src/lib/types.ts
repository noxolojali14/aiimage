export type ContentRow = {
  id: string;
  user_id: string;
  type: ContentType;
  title: string | null;
  prompt: string | null;
  result: string;
  language: string | null;
  created_at: string;
};

export type ImageRow = {
  id: string;
  user_id: string;
  prompt: string;
  style: string;
  mood: string;
  quality: string;
  aspect_ratio: string;
  image_url: string;
  is_demo: boolean;
  created_at: string;
};

export type ContentType =
  | 'blog'
  | 'email'
  | 'social'
  | 'ad'
  | 'product'
  | 'code'
  | 'image';

export type CodeLanguage =
  | 'Python'
  | 'JavaScript'
  | 'HTML'
  | 'CSS'
  | 'Java'
  | 'C#'
  | 'SQL';

export type ImageStyle =
  | 'Realistic Photography'
  | 'Digital Art'
  | 'Cartoon'
  | '3D Render'
  | 'Watercolour'
  | 'Illustration'
  | 'Anime'
  | 'Cinematic'
  | 'Minimalist'
  | 'Professional'
  | 'Artistic';

export type ImageMood =
  | 'Bright'
  | 'Calm'
  | 'Energetic'
  | 'Professional'
  | 'Dramatic'
  | 'Romantic'
  | 'Happy'
  | 'Mysterious'
  | 'Creative';

export type ImageSize = 'Square — 1:1' | 'Landscape — 16:9' | 'Portrait — 4:5' | 'Wide — 16:9';
export type ImageQuality = 'Standard' | 'High Quality';

export type ImageOptions = {
  style: ImageStyle;
  mood: ImageMood;
  quality: ImageQuality;
  aspectRatio: ImageSize;
};

export type GeneratedImage = {
  url: string;
  isDemo: boolean;
  prompt: string;
};
