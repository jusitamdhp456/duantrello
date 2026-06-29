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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Creative Briefs</h1>
        <Link href="/creative-briefs/new" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium flex items-center hover:bg-gray-800 transition">
          <Plus className="w-4 h-4 mr-2" /> New Brief
        </Link>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-gray-500" />
      ) : (
        <div className="space-y-4">
          {briefs.map(b => (
            <div key={b.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{b.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Campaign: {b.campaigns?.name || 'N/A'} • Platform: {b.platform} • Status: <span className="font-medium text-black capitalize">{b.status}</span>
                </p>
                <p className="text-sm text-gray-600 mt-3 max-w-2xl line-clamp-2">
                  <span className="font-semibold">Hook:</span> {b.hook}
                </p>
              </div>
              <div>
                {b.status === 'draft' && (
                  <button 
                    onClick={() => handleGenerateTasks(b.id)}
                    disabled={isGenerating === b.id}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium flex items-center transition disabled:opacity-50"
                  >
                    {isGenerating === b.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />} 
                    Generate Tasks
                  </button>
                )}
                {b.status === 'active' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Tasks Generated
                  </span>
                )}
              </div>
            </div>
          ))}
          {briefs.length === 0 && <p className="text-gray-500">No creative briefs found.</p>}
        </div>
      )}
    </div>
  );
}
