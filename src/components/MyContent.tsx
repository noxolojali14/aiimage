import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';

type HistoryItem =
  | ({ kind: 'text'; } & ContentRow)
  | ({ kind: 'image'; } & ImageRow);

type Tab = 'all' | 'text' | 'images';
type SortOrder = 'newest' | 'oldest';

const TYPE_LABELS: Record<string, string> = {
  blog: 'Blog Post',
  email: 'Email',
  social: 'Social Media',
  ad: 'Advertisement',
  product: 'Product Description',
  code: 'Code',
};

const TYPE_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'blog', label: 'Blog Post' },
  { id: 'email', label: 'Email' },
  { id: 'social', label: 'Social Media' },
  { id: 'ad', label: 'Advertisement' },
  { id: 'product', label: 'Product Description' },
  { id: 'code', label: 'Code' },
  { id: 'image', label: 'AI Image' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export default function MyContent() {
  const [tab, setTab] = useState<Tab>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [content, setContent] = useState<ContentRow[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<HistoryItem | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, i] = await Promise.all([fetchContent(), fetchImages()]);
      setContent(c);
      setImages(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Merge into a unified history list.
  const history: HistoryItem[] = useMemo(() => {
    const items: HistoryItem[] = [
      ...content.map((c) => ({ ...c, kind: 'text' as const })),
      ...images.map((i) => ({ ...i, kind: 'image' as const })),
    ];
    items.sort((a, b) => {
      const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === 'newest' ? -cmp : cmp;
    });
    return items;
  }, [content, images, sort]);

  // Apply tab + type + search filters.
  const filtered = useMemo(() => {
    return history.filter((item) => {
      // Tab filter
      if (tab === 'text' && item.kind !== 'text') return false;
      if (tab === 'images' && item.kind !== 'image') return false;

      // Type filter
      if (typeFilter !== 'all') {
        const itemType = item.kind === 'image' ? 'image' : (item as ContentRow).type;
        if (itemType !== typeFilter) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        if (item.kind === 'text') {
          const c = item as ContentRow;
          return (
            (c.title?.toLowerCase().includes(q) ?? false) ||
            c.result.toLowerCase().includes(q) ||
            (c.prompt?.toLowerCase().includes(q) ?? false)
          );
        }
        const img = item as ImageRow;
        return (
          img.prompt.toLowerCase().includes(q) ||
          img.style.toLowerCase().includes(q) ||
          img.mood.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [history, tab, typeFilter, search]);

  const totalCount = content.length + images.length;

  const handleDeleteContent = async (id: string) => {
    try {
      await deleteContent(id);
      setContent((prev) => prev.filter((c) => c.id !== id));
      setViewing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await deleteImage(id);
      setImages((prev) => prev.filter((i) => i.id !== id));
      setViewing(null);
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
          <h1 className="text-2xl font-extrabold text-gray-900">Generation History</h1>
          <p className="text-gray-500 text-sm">
            Everything you've ever generated — {totalCount} {totalCount === 1 ? 'item' : 'items'} saved.
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="card p-4 space-y-3">
        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, content, prompt, or style..."
              className="input-field pl-9"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`btn-secondary text-sm whitespace-nowrap ${showFilters ? 'ring-2 ring-brand-purple/30' : ''}`}
            >
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button
              onClick={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
              className="btn-secondary text-sm whitespace-nowrap"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sort === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        {/* Type filter chips */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-brand-lightPurple/30">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  typeFilter === f.id
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'bg-brand-lightPurple/30 text-gray-600 hover:bg-brand-lightPurple/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-brand-lightPurple/30 rounded-xl w-full sm:w-auto sm:inline-flex">
        <button
          onClick={() => setTab('all')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'all' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-500'
          }`}
        >
          <Calendar className="w-4 h-4" /> All ({totalCount})
        </button>
        <button
          onClick={() => setTab('text')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'text' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-500'
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

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          {search && ` for "${search}"`}
          {typeFilter !== 'all' && ` in ${TYPE_FILTERS.find((f) => f.id === typeFilter)?.label}`}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Loading your history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="FolderOpen"
          label={totalCount === 0 ? 'No history yet' : 'No results found'}
          hint={
            totalCount === 0
              ? 'Generate your first piece of content or image to start building your history.'
              : 'Try adjusting your search or filters.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) =>
            item.kind === 'text' ? (
              <TextCard
                key={item.id}
                item={item}
                copied={copiedId === item.id}
                onView={() => setViewing(item)}
                onCopy={() => handleCopy(item.id, item.result)}
                onDelete={() => handleDeleteContent(item.id)}
              />
            ) : (
              <ImageCard
                key={item.id}
                item={item}
                regenerating={regenerating === item.id}
                onRegenerate={() => handleRegenerateImage(item)}
                onDownload={() => handleDownloadImage(item.image_url)}
                onView={() => setViewing(item)}
                onDelete={() => handleDeleteImage(item.id)}
              />
            )
          )}
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
                  {viewing.kind === 'image'
                    ? 'AI Image'
                    : `${TYPE_LABELS[(viewing as ContentRow).type] ?? (viewing as ContentRow).type}${(viewing as ContentRow).language ? ` · ${(viewing as ContentRow).language}` : ''}`}
                </span>
                <h3 className="font-bold text-gray-900 mt-2">
                  {viewing.kind === 'text'
                    ? (viewing as ContentRow).title || 'Untitled'
                    : (viewing as ImageRow).prompt.slice(0, 60) || 'Untitled Image'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(viewing.created_at)} at {formatTime(viewing.created_at)}
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto">
              {viewing.kind === 'image' ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-brand-lightPurple/40 bg-brand-bg/30">
                    <img
                      src={(viewing as ImageRow).image_url}
                      alt={(viewing as ImageRow).prompt}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Tag>{(viewing as ImageRow).style}</Tag>
                    <Tag>{(viewing as ImageRow).mood}</Tag>
                    {(viewing as ImageRow).is_demo && <Tag amber>Demo</Tag>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Prompt used:</p>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">
                      {(viewing as ImageRow).prompt}
                    </pre>
                  </div>
                </div>
              ) : (
                <>
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-brand-bg/50 rounded-xl p-4 border border-brand-lightPurple/40">
                    {(viewing as ContentRow).result}
                  </pre>
                  {(viewing as ContentRow).prompt && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Prompt used:</p>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">
                        {(viewing as ContentRow).prompt}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-4 border-t border-brand-lightPurple/40 flex gap-2 justify-end">
              {viewing.kind === 'text' ? (
                <button onClick={() => handleCopy(viewing.id, (viewing as ContentRow).result)} className="btn-secondary text-xs">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              ) : (
                <button onClick={() => handleDownloadImage((viewing as ImageRow).image_url)} className="btn-secondary text-xs">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              )}
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

/* ---------------- Text card ---------------- */

function TextCard({
  item,
  copied,
  onView,
  onCopy,
  onDelete,
}: {
  item: ContentRow;
  copied: boolean;
  onView: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-full">
          {TYPE_LABELS[item.type] ?? item.type}
          {item.language ? ` · ${item.language}` : ''}
        </span>
        <span className="text-[11px] text-gray-400">{formatRelative(item.created_at)}</span>
      </div>
      <h3 className="font-bold text-gray-900 line-clamp-1">
        {item.title || 'Untitled'}
      </h3>
      <p className="text-sm text-gray-500 mt-1 line-clamp-3 flex-1 whitespace-pre-wrap">
        {item.result}
      </p>
      <div className="text-xs text-gray-400 mt-3">
        {formatDate(item.created_at)} · {formatTime(item.created_at)}
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        <button onClick={onView} className="btn-ghost text-xs">
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        <button onClick={onCopy} className="btn-ghost text-xs">
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={onDelete} className="btn-ghost text-xs text-red-500 hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ---------------- Image card ---------------- */

function ImageCard({
  item,
  regenerating,
  onRegenerate,
  onDownload,
  onView,
  onDelete,
}: {
  item: ImageRow;
  regenerating: boolean;
  onRegenerate: () => void;
  onDownload: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card p-4 flex flex-col">
      <button onClick={onView} className="rounded-xl overflow-hidden border border-brand-lightPurple/40 bg-brand-bg/30 mb-3 group">
        <img
          src={item.image_url}
          alt={item.prompt}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </button>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-700 line-clamp-2 font-medium flex-1">{item.prompt}</p>
        <span className="text-[11px] text-gray-400 ml-2 shrink-0">{formatRelative(item.created_at)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Tag>{item.style}</Tag>
        <Tag>{item.mood}</Tag>
        {item.is_demo && <Tag amber>Demo</Tag>}
      </div>
      <div className="text-xs text-gray-400 mt-2">
        {formatDate(item.created_at)} · {formatTime(item.created_at)}
      </div>
      <div className="flex gap-1.5 mt-3 flex-wrap">
        <button onClick={onView} className="btn-ghost text-xs">
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        <button onClick={onRegenerate} disabled={regenerating} className="btn-ghost text-xs">
          {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Regenerate
        </button>
        <button onClick={onDownload} className="btn-ghost text-xs">
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <button onClick={onDelete} className="btn-ghost text-xs text-red-500 hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ---------------- Shared ---------------- */

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
