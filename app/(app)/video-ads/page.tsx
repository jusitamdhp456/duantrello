"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createVideoAd } from '@/app/actions/marketing';
import { approveVideoAdAndAwardPoints } from '@/app/actions/performance';
import { Loader2, Plus, PlayCircle } from 'lucide-react';

export default function VideoAdsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [ads, setAds] = useState<any[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!activeWorkspaceId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      
      const [adsRes, briefsRes] = await Promise.all([
        supabase.from('video_ads').select('*, creative_briefs(title)').eq('workspace_id', activeWorkspaceId).order('created_at', { ascending: false }),
        supabase.from('creative_briefs').select('id, title').eq('workspace_id', activeWorkspaceId)
      ]);

      setAds(adsRes.data || []);
      setBriefs(briefsRes.data || []);
      setIsLoading(false);
    }
    fetchData();
  }, [activeWorkspaceId, supabase]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      brief_id: formData.get('brief_id') || null,
      version: formData.get('version') || 'v1',
      platform: formData.get('platform'),
      approval_status: formData.get('approval_status') || 'draft'
    };

    try {
      const newAd = await createVideoAd(data, activeWorkspaceId);
      // Optimistic addition
      setAds([{...newAd, creative_briefs: briefs.find(b => b.id === newAd.brief_id)}, ...ads]);
      setIsAdding(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!activeWorkspaceId) return <div className="p-8">Please select a workspace.</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Video Ads Library</h1>
        <button onClick={() => setIsAdding(true)} className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium flex items-center hover:bg-gray-800 transition">
          <Plus className="w-4 h-4 mr-2" /> New Video Ad
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title</label>
            <input required name="title" type="text" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brief</label>
            <select name="brief_id" className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
              <option value="">None</option>
              {briefs.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select name="platform" className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
              <option value="TikTok">TikTok</option>
              <option value="Facebook">Facebook Ads</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
            <input name="version" type="text" defaultValue="v1" className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="approval_status" className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black">
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="col-span-2 flex space-x-2 mt-2">
            <button type="submit" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition">Save Ad</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loader2 className="animate-spin text-gray-500" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map(ad => (
            <div key={ad.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition">
              <div className="bg-gray-100 h-40 flex items-center justify-center text-gray-400">
                {/* Thumbnail placeholder */}
                <PlayCircle className="w-12 h-12 opacity-50" />
              </div>
              <div className="p-4 flex-1">
                <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>Brief: <span className="font-medium text-gray-700">{ad.creative_briefs?.title || 'N/A'}</span></p>
                  <p>Platform: {ad.platform} • Version: {ad.version}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase tracking-wider ${
                    ad.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                    ad.approval_status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                    ad.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {ad.approval_status}
                  </span>
                  {ad.approval_status !== 'approved' && (
                    <button 
                      onClick={async () => {
                        try {
                          await approveVideoAdAndAwardPoints(ad.id, activeWorkspaceId);
                          setAds(ads.map(a => a.id === ad.id ? { ...a, approval_status: 'approved' } : a));
                          alert('Ad approved and points awarded!');
                        } catch (e: any) {
                          alert(e.message);
                        }
                      }}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Approve Ad
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {ads.length === 0 && <p className="text-gray-500 col-span-full">No video ads found.</p>}
        </div>
      )}
    </div>
  );
}
