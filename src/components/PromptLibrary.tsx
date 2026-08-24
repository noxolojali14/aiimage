import { useState } from 'react';
import { PROMPT_TEMPLATES } from '@/lib/prompts';
import { Icon } from './Icon';
import { BookMarked, Check, Copy, Sparkles, ChevronRight } from 'lucide-react';
import type { Page } from './Layout';

export default function PromptLibrary({
  onUseTemplate,
}: {
  onUseTemplate: (id: string) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleUse = (id: string) => {
    onUseTemplate(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-md">
          <BookMarked className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Prompt Library</h1>
          <p className="text-gray-500 text-sm">Pre-built prompt templates for every content type.</p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROMPT_TEMPLATES.map((t) => {
          const isOpen = expanded === t.id;
          const preview = t.build({});
          return (
            <div key={t.id} className="card p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple/10 to-brand-pink/10 flex items-center justify-center shrink-0">
                  <Icon name={t.icon} className="w-5 h-5 text-brand-purple" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 leading-tight">
                    {t.id === 'image' && '🎨 '}
                    {t.id === 'code' && '💻 '}
                    {t.label}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">{t.description}</p>

              <button
                onClick={() => setExpanded(isOpen ? null : t.id)}
                className="text-xs font-semibold text-brand-purple hover:underline text-left mb-3"
              >
                {isOpen ? 'Hide template' : 'View template'}
              </button>
              {isOpen && (
                <pre className="text-xs text-gray-600 bg-brand-bg rounded-lg p-3 whitespace-pre-wrap border border-brand-lightPurple/40 max-h-44 overflow-auto mb-3">
                  {preview}
                </pre>
              )}

              <div className="mt-auto flex gap-2">
                <button onClick={() => handleUse(t.id)} className="btn-primary text-xs flex-1">
                  {t.id === 'image' ? 'Use Image Prompt' : 'Use Prompt'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopy(t.id, preview)}
                  className="btn-secondary text-xs px-3"
                  aria-label="Copy template"
                >
                  {copiedId === t.id ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5 bg-gradient-to-r from-brand-lightPurple/20 to-brand-softPink/20 border-brand-pink/30">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand-pink shrink-0" />
          <p className="text-sm text-gray-700">
            Each template dynamically fills in your selections — topic, tone, style, mood, and more —
            to produce a customised prompt ready for generation.
          </p>
        </div>
      </div>
    </div>
  );
}

export type { Page };
