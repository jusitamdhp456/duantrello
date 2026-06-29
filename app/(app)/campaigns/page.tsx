"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createCampaign } from '@/app/actions/marketing';
import { Loader2, Plus } from 'lucide-react';

export default function CampaignsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchCampaigns() {
      if (!activeWorkspaceId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', activeWorkspaceId)
        .order('created_at', { ascending: false });
      setCampaigns(data || []);
      setIsLoading(false);
    }
    fetchCampaigns();
  }, [activeWorkspaceId, supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeWorkspaceId) return;
    try {
      const newCampaign = await createCampaign(name, activeWorkspaceId);
      setCampaigns([newCampaign, ...campaigns]);
      setName('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeWorkspaceId) return <div className="p-8">Please select a workspace.</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <button onClick={() => setIsAdding(true)} className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input 
            type="text" 
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campaign Name..." 
            className="w-full text-sm p-2 mb-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-black"
          />
          <div className="flex space-x-2 mt-2">
            <button type="submit" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loader2 className="animate-spin text-gray-500" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
              <h3 className="font-bold text-lg text-gray-900">{c.name}</h3>
              <p className="text-sm text-gray-500 mt-2 capitalize">Status: {c.status}</p>
            </div>
          ))}
          {campaigns.length === 0 && <p className="text-gray-500 col-span-full">No campaigns found.</p>}
        </div>
      )}
    </div>
  );
}
