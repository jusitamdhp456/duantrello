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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-light text-gray-700 tracking-wide">Video Ads Library</h1>
        <button onClick={() => setIsAdding(true)} className="bg-neu-base text-gray-600 px-6 py-3 rounded-full shadow-neu-convex hover:shadow-neu-concave text-sm font-bold transition-all duration-200 uppercase tracking-widest flex items-center">
          <Plus className="w-5 h-5 mr-2" /> New Video Ad
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="mb-10 bg-neu-base p-8 rounded-[2rem] shadow-neu-concave border-none grid grid-cols-2 gap-6 max-w-3xl">
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">Ad Title</label>
            <input required name="title" type="text" className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">Brief</label>
            <select name="brief_id" className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium">
              <option value="">None</option>
              {briefs.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">Platform</label>
            <select name="platform" className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium">
              <option value="TikTok">TikTok</option>
              <option value="Facebook">Facebook Ads</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">Version</label>
            <input name="version" type="text" defaultValue="v1" className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">Status</label>
            <select name="approval_status" className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium">
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="col-span-2 flex space-x-4 mt-4">
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-neu-convex active:shadow-neu-pressed transition-all">Save Ad</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-neu-base text-gray-500 px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave transition-all">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ads.map(ad => (
            <div key={ad.id} className="bg-neu-base rounded-[2rem] shadow-neu-convex overflow-hidden flex flex-col hover:shadow-neu-concave transition-all duration-300 p-6">
              <div className="bg-neu-base shadow-neu-concave rounded-2xl h-48 flex items-center justify-center text-gray-400">
                {/* Thumbnail placeholder */}
                <PlayCircle className="w-14 h-14 text-indigo-400/50 drop-shadow-sm" />
              </div>
              <div className="pt-6 flex-1 flex flex-col">
                <h3 className="font-semibold text-xl text-gray-700 line-clamp-1 tracking-wide">{ad.title}</h3>
                <div className="mt-4 text-xs text-gray-500 space-y-3 font-medium">
                  <p className="flex items-center"><span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-md mr-2">Brief</span> <span className="text-gray-700">{ad.creative_briefs?.title || 'N/A'}</span></p>
                  <p className="flex items-center"><span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-md mr-2">Platform</span> {ad.platform} <span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-md ml-3 mr-2">Version</span> {ad.version}</p>
                </div>
                <div className="mt-auto pt-6 flex justify-between items-center">
                  <span className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider bg-neu-base shadow-neu-concave ${
                    ad.approval_status === 'approved' ? 'text-green-500' :
                    ad.approval_status === 'review' ? 'text-yellow-500' :
                    ad.approval_status === 'rejected' ? 'text-red-500' :
                    'text-gray-500'
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
                      className="text-xs font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-all px-4 py-2 bg-neu-base shadow-neu-convex hover:shadow-neu-concave rounded-full"
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
