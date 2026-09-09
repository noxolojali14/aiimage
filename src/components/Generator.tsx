import { useState, useEffect } from 'react';
import {
  CONTENT_TYPES,
  CODE_LANGUAGES,
  IMAGE_STYLES,
  IMAGE_MOODS,
  IMAGE_SIZES,
  IMAGE_QUALITIES,
} from '@/lib/constants';
import { buildPrompt, buildImagePrompt } from '@/lib/prompts';
import { generateAIText } from '@/lib/textClient';
import { generateAIImage } from '@/lib/imageClient';
import { validatePromptType, formatMismatchMessage } from '@/lib/validation';
import { saveContent, saveImage } from '@/lib/data';
import type {
  ContentType,
  CodeLanguage,
  ImageStyle,
  ImageMood,
  ImageSize,
  ImageQuality,
} from '@/lib/types';
import { Icon } from './Icon';
import {
  Wand2,
  Loader2,
  Copy,
  Check,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Image as ImageIcon,
  Sparkles,
  ArrowRightCircle,
} from 'lucide-react';

type Props = {
  initialType: ContentType;
  onSaved: () => void;
};

export default function Generator({ initialType, onSaved }: Props) {
  const [type, setType] = useState<ContentType>(initialType);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  const isImage = type === 'image';
  const isCode = type === 'code';

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-brand-purple" />
          Content Generator
        </h1>
        <p className="text-gray-500 mt-1">
          Choose a content type, enter your requirements, and generate.
        </p>
      </header>

      {/* Content type selector */}
      <div className="card p-4">
        <label className="label-text">Content Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {CONTENT_TYPES.map((ct) => {
            const active = type === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => setType(ct.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  active
                    ? 'border-brand-purple bg-gradient-to-b from-brand-purple/10 to-brand-pink/10 text-brand-purple shadow-sm'
                    : 'border-brand-lightPurple/50 bg-white text-gray-600 hover:border-brand-pink/40'
                }`}
              >
                <Icon name={ct.icon} className="w-5 h-5" />
                <span className="text-xs font-semibold leading-tight">{ct.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isImage ? (
        <ImageGenerator onSaved={onSaved} />
      ) : (
        <TextCodeGenerator type={type} isCode={isCode} onSaved={onSaved} onSwitchType={setType} />
      )}
    </div>
  );
}

/* ---------------- Text / Code generator ---------------- */

function TextCodeGenerator({
  type,
  isCode,
  onSaved,
  onSwitchType,
}: {
  type: ContentType;
  isCode: boolean;
  onSaved: () => void;
  onSwitchType: (t: ContentType) => void;
}) {
  const [language, setLanguage] = useState<CodeLanguage>('Python');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatchType, setMismatchType] = useState<ContentType | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    setPrompt('');
    setResult('');
    setSaved(false);
    setError(null);
    setMismatchType(null);
    setShowPrompt(false);
  }, [type, isCode]);

  const builtPrompt = isCode
    ? buildPrompt('code', { language, task: prompt })
    : buildPrompt(type, { topic: prompt });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want to generate.');
      return;
    }
    // Validate that the request matches the selected content type.
    const validation = validatePromptType(type, prompt);
    if (!validation.valid) {
      setError(formatMismatchMessage(validation));
      setMismatchType(validation.detectedType);
      setResult('');
      return;
    }
    setError(null);
    setMismatchType(null);
    setSaved(false);
    setLoading(true);
    setResult('');

    // Step 1: Generate the content via AI.
    let generatedText: string;
    let isDemoResult = false;
    try {
      const res = await generateAIText({
        type,
        prompt,
        systemPrompt: builtPrompt,
        language: isCode ? language : undefined,
      });
      generatedText = res.text;
      isDemoResult = res.isDemo;
    } catch {
      setLoading(false);
      setError('Generation failed. Please try again.');
      return;
    }

    // Step 2: Display the result immediately.
    setResult(generatedText);
    setLoading(false);

    // Step 3: Only save to history if generation succeeded.
    try {
      await saveContent({
        type,
        title: prompt.slice(0, 60) || (isCode ? language : type),
        prompt: builtPrompt,
        result: generatedText,
        language: isCode ? language : null,
      });
      setSaved(true);
      onSaved();
    } catch (e) {
      // Result is displayed — history save failed but user can still use the content.
      setError(
        (e instanceof Error ? e.message : 'Failed to save to history.') +
          ' Your content is still displayed above.'
      );
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await saveContent({
        type,
        title: prompt.slice(0, 60) || (isCode ? language : type),
        prompt: builtPrompt,
        result,
        language: isCode ? language : null,
      });
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    }
  };

  const handleClear = () => {
    setResult('');
    setPrompt('');
    setSaved(false);
    setError(null);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Inputs */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5 space-y-4">
          {isCode && (
            <div>
              <label className="label-text">Programming Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                className="input-field"
              >
                {CODE_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label-text">
              {isCode ? 'Describe the code you need' : `Describe your ${contentTypeLabel(type).toLowerCase()}`}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="input-field resize-none"
              placeholder={getContentPlaceholder(type, isCode)}
            />
          </div>

          <button
            onClick={() => setShowPrompt((s) => !s)}
            className="text-xs font-semibold text-brand-purple hover:underline"
          >
            {showPrompt ? 'Hide' : 'View'} customised prompt
          </button>
          {showPrompt && (
            <pre className="text-xs text-gray-600 bg-brand-bg rounded-lg p-3 whitespace-pre-wrap border border-brand-lightPurple/40 max-h-48 overflow-auto">
              {builtPrompt}
            </pre>
          )}

          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate {isCode ? 'Code' : 'Content'}
              </>
            )}
          </button>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
              {mismatchType && (
                <button
                  onClick={() => onSwitchType(mismatchType)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-purple px-3 py-1.5 rounded-lg hover:brightness-105 transition-all"
                >
                  <ArrowRightCircle className="w-3.5 h-3.5" />
                  Switch to {contentTypeLabel(mismatchType)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="lg:col-span-3">
        <div className="card p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900">{contentTypeLabel(type)} Result</h3>
              <p className="text-xs text-gray-400 mt-0.5">Generated specifically for the selected content type</p>
            </div>
            {result && (
              <div className="flex flex-wrap gap-2">
                <button onClick={handleCopy} className="btn-ghost text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                {saved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg text-green-600 bg-green-50">
                    <Check className="w-3.5 h-3.5" /> Saved to history
                  </span>
                ) : (
                  <button onClick={handleSave} className="btn-ghost text-xs">
                    <Save className="w-3.5 h-3.5" /> Save to history
                  </button>
                )}
                <button onClick={handleGenerate} className="btn-ghost text-xs">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
                <button onClick={handleClear} className="btn-ghost text-xs">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-brand-purple animate-spin mb-4" />
              <p className="text-gray-500 text-sm">✨ Generating your {isCode ? 'code' : 'content'}...</p>
              <div className="mt-6 w-full max-w-sm space-y-2.5">
                {[100, 85, 92, 70].map((w, i) => (
                  <div key={i} className="h-3 rounded-full shimmer-bg" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ) : result ? (
            <pre className="flex-1 text-sm text-gray-800 whitespace-pre-wrap font-mono bg-brand-bg/50 rounded-xl p-4 border border-brand-lightPurple/40 overflow-auto max-h-[60vh]">
              {result}
            </pre>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-brand-lightPurple/30 flex items-center justify-center mb-3">
                <Wand2 className="w-6 h-6 text-brand-purple" />
              </div>
              <p className="text-gray-400 text-sm max-w-xs">
                Your generated {contentTypeLabel(type).toLowerCase()} will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Image generator ---------------- */

function ImageGenerator({ onSaved }: { onSaved: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('Realistic Photography');
  const [mood, setMood] = useState<ImageMood>('Bright');
  const [size, setSize] = useState<ImageSize>('Square — 1:1');
  const [quality, setQuality] = useState<ImageQuality>('Standard');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const builtPrompt = buildImagePrompt({
    image_description: prompt,
    style,
    mood,
    quality,
    aspect_ratio: size,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe the image you want.');
      return;
    }
    setError(null);
    setSaved(false);
    setLoading(true);
    setImageUrl(null);

    // Step 1: Generate the image.
    let res;
    try {
      res = await generateAIImage(prompt, {
        style,
        mood,
        quality,
        aspectRatio: size,
      });
    } catch {
      setLoading(false);
      setError('Image generation failed. Please try again.');
      return;
    }

    // Step 2: Display the image immediately.
    setImageUrl(res.url);
    setIsDemo(res.isDemo);
    setLoading(false);

    // Step 3: Save to history only after successful generation.
    try {
      await saveImage({
        prompt,
        style,
        mood,
        quality,
        aspect_ratio: size,
        image_url: res.url,
        is_demo: res.isDemo,
      });
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : 'Failed to save image to history.') +
          ' Your image is still displayed above.'
      );
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(builtPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSave = async () => {
    if (!imageUrl) return;
    try {
      await saveImage({
        prompt,
        style,
        mood,
        quality,
        aspect_ratio: size,
        image_url: imageUrl,
        is_demo: isDemo,
      });
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save image.');
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartcontent-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const handleClear = () => {
    setImageUrl(null);
    setPrompt('');
    setSaved(false);
    setError(null);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Controls */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label-text">Describe the image you want</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="input-field resize-none"
              placeholder="Example: A beautiful sunset over Cape Town with Table Mountain in the background, realistic photography style."
            />
          </div>

          <div>
            <label className="label-text">Image Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ImageStyle)}
              className="input-field"
            >
              {IMAGE_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value as ImageMood)}
              className="input-field"
            >
              {IMAGE_MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Image Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as ImageSize)}
                className="input-field"
              >
                {IMAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as ImageQuality)}
                className="input-field"
              >
                {IMAGE_QUALITIES.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowPrompt((s) => !s)}
            className="text-xs font-semibold text-brand-purple hover:underline"
          >
            {showPrompt ? 'Hide' : 'View'} customised image prompt
          </button>
          {showPrompt && (
            <pre className="text-xs text-gray-600 bg-brand-bg rounded-lg p-3 whitespace-pre-wrap border border-brand-lightPurple/40 max-h-48 overflow-auto">
              {builtPrompt}
            </pre>
          )}

          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" /> Generate Image
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Result */}
      <div className="lg:col-span-3">
        <div className="card p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Generated Image</h3>
            {isDemo && imageUrl && (
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                AI Image Mode
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-brand-purple animate-spin mb-4" />
              <p className="text-gray-500 text-sm">✨ Creating your image...</p>
              <div className="mt-6 w-full max-w-sm aspect-video rounded-xl shimmer-bg" />
            </div>
          ) : imageUrl ? (
            <div className="flex flex-col items-center">
              <div className="w-full rounded-xl overflow-hidden border border-brand-lightPurple/40 bg-brand-bg/30 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={prompt}
                  className="w-full h-auto max-h-[55vh] object-contain"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button onClick={handleGenerate} className="btn-secondary text-xs">
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                </button>
                {saved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-green-600 bg-green-50">
                    <Check className="w-3.5 h-3.5" /> Saved to history
                  </span>
                ) : (
                  <button onClick={handleSave} className="btn-secondary text-xs">
                    <Save className="w-3.5 h-3.5" /> Save to history
                  </button>
                )}
                <button onClick={handleCopyPrompt} className="btn-secondary text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Prompt'}
                </button>
                <button onClick={handleDownload} className="btn-secondary text-xs">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={handleClear} className="btn-secondary text-xs">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-brand-lightPurple/30 flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6 text-brand-purple" />
              </div>
              <p className="text-gray-400 text-sm max-w-xs">
                Your generated image will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function contentTypeLabel(type: ContentType): string {
  switch (type) {
    case 'blog':
      return 'Blog Post';
    case 'email':
      return 'Professional Email';
    case 'social':
      return 'Social Media Post';
    case 'ad':
      return 'Advertisement';
    case 'product':
      return 'Product Description';
    case 'code':
      return 'Code';
    case 'image':
      return 'AI Image';
    default:
      return 'Content';
  }
}

function getContentPlaceholder(type: ContentType, isCode: boolean): string {
  if (isCode) return 'Example: A function that reverses a string.';
  switch (type) {
    case 'blog':
      return 'Example: A blog post about the benefits of remote work for small teams.';
    case 'email':
      return 'Example: A follow-up email to a client after a product demo.';
    case 'social':
      return 'Example: An Instagram post announcing our summer sale.';
    case 'ad':
      return 'Example: A Facebook ad for a new fitness app targeting busy professionals.';
    case 'product':
      return 'Example: A product description for wireless noise-cancelling headphones.';
    default:
      return 'Describe what you want to generate.';
  }
}
