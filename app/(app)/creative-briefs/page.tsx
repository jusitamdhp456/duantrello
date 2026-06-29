"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import { generateTasksFromBrief } from '@/app/actions/marketing';

export default function BriefsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [briefs, setBriefs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBriefs() {
      if (!activeWorkspaceId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data } = await supabase
        .from('creative_briefs')
        .select('*, campaigns(name)')
        .eq('workspace_id', activeWorkspaceId)
        .order('created_at', { ascending: false });
      setBriefs(data || []);
      setIsLoading(false);
    }
    fetchBriefs();
  }, [activeWorkspaceId, supabase]);

  const handleGenerateTasks = async (briefId: string) => {
    if (!activeWorkspaceId) return;
    setIsGenerating(briefId);
    try {
      await generateTasksFromBrief(briefId, activeWorkspaceId);
      // Update local status
      setBriefs(briefs.map(b => b.id === briefId ? { ...b, status: 'active' } : b));
      alert('Tasks generated successfully in a new Board!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(null);
    }
  };

  if (!activeWorkspaceId) return <div className="p-8">Please select a workspace.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-light text-gray-700 tracking-wide">Creative Briefs</h1>
        <Link href="/creative-briefs/new" className="bg-neu-base text-gray-600 px-6 py-3 rounded-full shadow-neu-convex hover:shadow-neu-concave text-sm font-bold transition-all duration-200 uppercase tracking-widest flex items-center">
          <Plus className="w-5 h-5 mr-2" /> New Brief
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500 w-8 h-8" /></div>
      ) : (
        <div className="space-y-6">
          {briefs.map(b => (
            <div key={b.id} className="bg-neu-base p-8 rounded-[2rem] shadow-neu-convex flex flex-col md:flex-row justify-between md:items-center">
              <div className="mb-6 md:mb-0">
                <h3 className="font-semibold text-2xl text-gray-700 tracking-wide">{b.title}</h3>
                <p className="text-sm text-gray-500 mt-4 font-medium flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-full">Campaign: {b.campaigns?.name || 'N/A'}</span>
                  <span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-full">Platform: {b.platform}</span>
                  <span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-full uppercase tracking-widest text-xs font-bold flex items-center">Status: {b.status}</span>
                </p>
                <div className="mt-6 bg-neu-base shadow-neu-concave p-4 rounded-xl max-w-2xl">
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    <span className="font-bold text-gray-700 uppercase tracking-wider text-xs mr-2">Hook:</span> {b.hook}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 ml-0 md:ml-6">
                {b.status === 'draft' && (
                  <button 
                    onClick={() => handleGenerateTasks(b.id)}
                    disabled={isGenerating === b.id}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-neu-convex active:shadow-neu-pressed transition-all disabled:opacity-50 flex items-center"
                  >
                    {isGenerating === b.id ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2 drop-shadow-sm" />} 
                    Generate Tasks
                  </button>
                )}
                {b.status === 'active' && (
                  <span className="inline-flex items-center px-6 py-3 rounded-full text-xs font-bold text-green-500 bg-neu-base shadow-neu-concave uppercase tracking-widest">
                    Tasks Generated
                  </span>
                )}
              </div>
            </div>
          ))}
          {briefs.length === 0 && <p className="text-gray-500 text-center py-8">No creative briefs found.</p>}
        </div>
      )}
    </div>
  );
}
