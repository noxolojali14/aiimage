import { useEffect, useState, useCallback } from 'react';
import { fetchContent, fetchImages, deleteContent, deleteImage, saveImage } from '@/lib/data';
import { generateAIImage } from '@/lib/imageClient';
import type { ContentRow, ImageRow } from '@/lib/types';
import { Icon } from './Icon';
import {
  FolderOpen,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Download,
  Eye,
  Loader2,
  Image as ImageIcon,
  FileText,
  X,
} from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  blog: 'Blog Post',
  email: 'Email',
  social: 'Social Media',
  ad: 'Advertisement',
  product: 'Product Description',
  code: 'Code',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MyContent() {
  const [tab, setTab] = useState<'content' | 'images'>('content');
  const [content, setContent] = useState<ContentRow[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ContentRow | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, i] = await Promise.all([fetchContent(), fetchImages()]);
      setContent(c);
      setImages(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteContent = async (id: string) => {
    try {
      await deleteContent(id);
      setContent((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await deleteImage(id);
      setImages((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadImage = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = obj;
      a.download = `smartcontent-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(obj);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleRegenerateImage = async (img: ImageRow) => {
    setRegenerating(img.id);
    try {
      const res = await generateAIImage(img.prompt, {
        style: img.style as never,
        mood: img.mood as never,
        quality: img.quality as never,
        aspectRatio: img.aspect_ratio as never,
      });
      await saveImage({
        prompt: img.prompt,
        style: img.style,
        mood: img.mood,
        quality: img.quality,
        aspect_ratio: img.aspect_ratio,
        image_url: res.url,
        is_demo: res.isDemo,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regenerate failed.');
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-md">
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Content</h1>
          <p className="text-gray-500 text-sm">All your generated content and images in one place.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-brand-lightPurple/30 rounded-xl w-full sm:w-auto sm:inline-flex">
        <button
          onClick={() => setTab('content')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'content' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-500'
          }`}
        >
          <FileText className="w-4 h-4" /> Written ({content.length})
        </button>
        <button
          onClick={() => setTab('images')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'images' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-500'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Images ({images.length})
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Loading your content...</p>
        </div>
      ) : tab === 'content' ? (
        content.length === 0 ? (
          <EmptyState icon="FileText" label="No written content yet" hint="Generate your first blog post, email, or code snippet." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((c) => (
              <div key={c.id} className="card p-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full">
                    {TYPE_LABELS[c.type] ?? c.type}
                    {c.language ? ` · ${c.language}` : ''}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 line-clamp-1">
                  {c.title || 'Untitled'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-3 flex-1 whitespace-pre-wrap">
                  {c.result}
                </p>
                <div className="text-xs text-gray-400 mt-3">
                  {formatDate(c.created_at)} · {formatTime(c.created_at)}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => setViewing(c)} className="btn-ghost text-xs">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => handleCopy(c.id, c.result)} className="btn-ghost text-xs">
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === c.id ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={() => handleDeleteContent(c.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : images.length === 0 ? (
        <EmptyState icon="Image" label="No images yet" hint="Generate your first AI image from the Generator." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="card p-4 flex flex-col">
              <div className="rounded-xl overflow-hidden border border-brand-lightPurple/40 bg-brand-bg/30 mb-3">
                <img
                  src={img.image_url}
                  alt={img.prompt}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-sm text-gray-700 line-clamp-2 font-medium">{img.prompt}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Tag>{img.style}</Tag>
                <Tag>{img.mood}</Tag>
                {img.is_demo && <Tag amber>Demo</Tag>}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {formatDate(img.created_at)} · {formatTime(img.created_at)}
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                <button
                  onClick={() => handleRegenerateImage(img)}
                  disabled={regenerating === img.id}
                  className="btn-ghost text-xs"
                >
                  {regenerating === img.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Regenerate
                </button>
                <button onClick={() => handleDownloadImage(img.image_url)} className="btn-ghost text-xs">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => handleDeleteImage(img.id)} className="btn-ghost text-xs text-red-500 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viewer modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-brand-lightPurple/40">
              <div>
                <span className="text-xs font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full">
                  {TYPE_LABELS[viewing.type] ?? viewing.type}
                  {viewing.language ? ` · ${viewing.language}` : ''}
                </span>
                <h3 className="font-bold text-gray-900 mt-2">{viewing.title || 'Untitled'}</h3>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-brand-bg/50 rounded-xl p-4 border border-brand-lightPurple/40">
                {viewing.result}
              </pre>
              {viewing.prompt && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Prompt used:</p>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {viewing.prompt}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-brand-lightPurple/40 flex gap-2 justify-end">
              <button onClick={() => handleCopy(viewing.id, viewing.result)} className="btn-secondary text-xs">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button onClick={() => setViewing(null)} className="btn-primary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ children, amber }: { children: React.ReactNode; amber?: boolean }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        amber ? 'bg-amber-100 text-amber-700' : 'bg-brand-lightPurple/40 text-brand-purple'
      }`}
    >
      {children}
    </span>
  );
}

function EmptyState({ icon, label, hint }: { icon: string; label: string; hint: string }) {
  return (
    <div className="card p-12 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-lightPurple/30 flex items-center justify-center mb-3">
        <Icon name={icon} className="w-6 h-6 text-brand-purple" />
      </div>
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-sm text-gray-400 mt-1">{hint}</p>
    </div>
  );
}
