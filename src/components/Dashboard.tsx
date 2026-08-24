import { useEffect, useState } from 'react';
import type { Page } from './Layout';
import { CONTENT_TYPES } from '@/lib/constants';
import { fetchContent, fetchImages } from '@/lib/data';
import { Icon } from './Icon';
import {
  Sparkles,
  FileText,
  Mail,
  Share2,
  Megaphone,
  Package,
  Code2,
  Image as ImageIcon,
  TrendingUp,
  FolderOpen,
  Wand2,
  ChevronRight,
} from 'lucide-react';

const QUICK_ACTIONS: {
  type: typeof CONTENT_TYPES[number]['id'];
  icon: typeof FileText;
  label: string;
  desc: string;
  cta: string;
}[] = [
  { type: 'blog', icon: FileText, label: 'Blog Post', desc: 'Write engaging articles.', cta: 'Write Post' },
  { type: 'email', icon: Mail, label: 'Professional Email', desc: 'Compose business emails.', cta: 'Write Email' },
  { type: 'social', icon: Share2, label: 'Social Media Post', desc: 'Create shareable content.', cta: 'Create Post' },
  { type: 'ad', icon: Megaphone, label: 'Advertisement', desc: 'Write persuasive ad copy.', cta: 'Write Ad' },
  { type: 'product', icon: Package, label: 'Product Description', desc: 'Selling descriptions.', cta: 'Write Description' },
  { type: 'code', icon: Code2, label: 'Code', desc: 'Generate code in 7 languages.', cta: 'Generate Code' },
  { type: 'image', icon: ImageIcon, label: 'AI Image', desc: 'Generate unique AI images from simple text descriptions.', cta: 'Create Image' },
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: 'Blog',
  email: 'Email',
  social: 'Social Media',
  ad: 'Advertisement',
  product: 'Product Description',
  code: 'Code',
  image: 'Image',
};

export default function Dashboard({
  onNavigate,
  onPickType,
}: {
  onNavigate: (p: Page) => void;
  onPickType: (type: string) => void;
}) {
  const [contentCount, setContentCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [c, i] = await Promise.all([fetchContent(), fetchImages()]);
        if (!active) return;
        setContentCount(c.length);
        setImageCount(i.length);
      } catch {
        // ignore — counts will stay 0
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalSaved = contentCount + imageCount;

  const handleQuickAction = (type: string) => {
    onPickType(type);
    onNavigate('generator');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-purple via-brand-pink to-brand-softPink p-8 sm:p-10 text-white shadow-lg">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Welcome back
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            What will you create today?
          </h1>
          <p className="mt-3 text-white/90 max-w-xl">
            Generate blog posts, emails, social content, ads, product descriptions, code, and
            AI-generated images — all from one beautiful workspace.
          </p>
          <button
            onClick={() => onNavigate('generator')}
            className="mt-6 inline-flex items-center gap-2 bg-white text-brand-purple px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <Wand2 className="w-4 h-4" />
            Start Creating
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Content Types" value="7" icon="Type" accent="from-brand-purple to-brand-pink" />
        <StatCard
          label="Saved Items"
          value={loading ? '—' : String(totalSaved)}
          icon="FolderOpen"
          accent="from-brand-pink to-brand-softPink"
        />
        <StatCard
          label="Written Content"
          value={loading ? '—' : String(contentCount)}
          icon="FileText"
          accent="from-brand-purple to-brand-lightPurple"
        />
        <StatCard
          label="AI Images"
          value={loading ? '—' : String(imageCount)}
          icon="Image"
          accent="from-brand-softPink to-brand-pink"
        />
      </section>

      {/* Quick Actions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <button
            onClick={() => onNavigate('generator')}
            className="text-sm font-semibold text-brand-purple hover:underline inline-flex items-center gap-1"
          >
            Open Generator <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a) => {
            const IconCmp = a.icon;
            return (
              <button
                key={a.type}
                onClick={() => handleQuickAction(a.type)}
                className="card p-5 text-left group hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-purple/10 to-brand-pink/10 flex items-center justify-center mb-3 group-hover:from-brand-purple group-hover:to-brand-pink transition-all">
                  <IconCmp className="w-5 h-5 text-brand-purple group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900">{a.label}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-3">{a.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-purple group-hover:gap-2 transition-all">
                  {a.cta} <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Content Types breakdown */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-brand-pink" />
          <h2 className="text-lg font-bold text-gray-900">Content Types</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {CONTENT_TYPES.map((ct) => (
            <div
              key={ct.id}
              className="rounded-xl border border-brand-lightPurple/50 bg-gradient-to-b from-white to-brand-bg/40 p-4 text-center hover:border-brand-pink/40 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-purple/10 to-brand-pink/10 flex items-center justify-center mx-auto mb-2">
                <Icon name={ct.icon} className="w-4 h-4 text-brand-purple" />
              </div>
              <p className="text-xs font-bold text-gray-800">{CONTENT_TYPE_LABELS[ct.id]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}
      >
        <Icon name={icon} className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
