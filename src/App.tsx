import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import AuthPage from '@/components/AuthPage';
import Layout, { type Page } from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import Generator from '@/components/Generator';
import PromptLibrary from '@/components/PromptLibrary';
import MyContent from '@/components/MyContent';
import { Loader2 } from 'lucide-react';
import type { ContentType } from '@/lib/types';

function AppInner() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [genType, setGenType] = useState<ContentType>('blog');

  const refreshKey = useState(0)[1];
  const handleSaved = useCallback(() => {
    refreshKey((n) => n + 1);
  }, [refreshKey]);

  const pickType = (type: string) => {
    setGenType(type as ContentType);
    setPage('generator');
  };

  const useTemplate = (id: string) => {
    setGenType(id as ContentType);
    setPage('generator');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Layout current={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} onPickType={pickType} />}
      {page === 'generator' && <Generator key={genType} initialType={genType} onSaved={handleSaved} />}
      {page === 'library' && <PromptLibrary onUseTemplate={useTemplate} />}
      {page === 'content' && <MyContent />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
