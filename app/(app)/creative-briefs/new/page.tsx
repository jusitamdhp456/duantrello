"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createBrief } from '@/app/actions/marketing';
import { useRouter } from 'next/navigation';

export default function NewBriefPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchCampaigns() {
      if (!activeWorkspaceId) return;
      const supabase = createClient();
      const { data } = await supabase.from('campaigns').select('id, name').eq('workspace_id', activeWorkspaceId);
      setCampaigns(data || []);
    }
    fetchCampaigns();
  }, [activeWorkspaceId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      campaign_id: formData.get('campaign_id') || null,
      platform: formData.get('platform'),
      audience: formData.get('audience'),
      pain_point: formData.get('pain_point'),
      hook: formData.get('hook'),
      angle: formData.get('angle'),
      offer: formData.get('offer'),
      cta: formData.get('cta'),
    };
    
    try {
      await createBrief(data, activeWorkspaceId);
      router.push('/creative-briefs');
    } catch (err: any) {
      alert(err.message);
      setIsSubmitting(false);
    }
  };

  if (!activeWorkspaceId) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Brief</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brief Title</label>
          <input required name="title" type="text" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
            <select name="campaign_id" className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
              <option value="">None</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select name="platform" className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
              <option value="TikTok">TikTok</option>
              <option value="Facebook">Facebook Ads</option>
              <option value="YouTube">YouTube Shorts</option>
              <option value="Instagram">Instagram Reels</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <textarea name="audience" rows={2} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pain Point</label>
          <textarea name="pain_point" rows={2} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hook (First 3 seconds)</label>
          <textarea name="hook" rows={2} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Angle / Body</label>
          <textarea name="angle" rows={3} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer</label>
            <input name="offer" type="text" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action (CTA)</label>
            <input name="cta" type="text" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Brief'}
          </button>
        </div>
      </form>
    </div>
  );
}
