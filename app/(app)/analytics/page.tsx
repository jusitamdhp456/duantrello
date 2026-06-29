"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveAdMetrics } from '@/app/actions/performance';
import { Loader2, TrendingUp, DollarSign, MousePointerClick } from 'lucide-react';

export default function AnalyticsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [ads, setAds] = useState<any[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!activeWorkspaceId) return;
      setIsLoading(true);
      
      const { data: videoAds } = await supabase
        .from('video_ads')
        .select('id, title, platform, approval_status')
        .eq('workspace_id', activeWorkspaceId);
        
      if (videoAds) {
        const adIds = videoAds.map(a => a.id);
        const { data: metrics } = await supabase
          .from('ad_metrics')
          .select('*')
          .in('video_ad_id', adIds);
          
        const map: Record<string, any> = {};
        metrics?.forEach(m => {
          // just taking the latest for simplicity in this MVP
          if (!map[m.video_ad_id] || new Date(m.date_recorded) > new Date(map[m.video_ad_id].date_recorded)) {
            map[m.video_ad_id] = m;
          }
        });
        setMetricsMap(map);
      }

      setAds(videoAds || []);
      setIsLoading(false);
    }
    fetchData();
  }, [activeWorkspaceId, supabase]);

  const handleSaveMetrics = async (e: React.FormEvent<HTMLFormElement>, adId: string) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setIsUpdating(adId);
    const formData = new FormData(e.currentTarget);
    const data = {
      spend: Number(formData.get('spend')),
      roas: Number(formData.get('roas')),
      clicks: Number(formData.get('clicks')),
      conversions: Number(formData.get('conversions'))
    };

    try {
      await saveAdMetrics(adId, activeWorkspaceId, data);
      setMetricsMap({
        ...metricsMap,
        [adId]: { ...metricsMap[adId], ...data }
      });
      alert('Metrics updated successfully');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  if (!activeWorkspaceId) return <div className="p-8">Please select a workspace.</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center"><TrendingUp className="w-6 h-6 mr-2" /> Performance Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track spend and ROAS for your video ads</p>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-gray-500" />
      ) : (
        <div className="space-y-6">
          {ads.map(ad => {
            const metrics = metricsMap[ad.id] || {};
            return (
              <div key={ad.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">{ad.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{ad.platform} • {ad.approval_status}</p>
                  </div>
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Spend</p>
                      <p className="font-bold text-gray-900">${metrics.spend || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">ROAS</p>
                      <p className="font-bold text-green-600">{metrics.roas || 0}x</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <form onSubmit={(e) => handleSaveMetrics(e, ad.id)} className="flex items-end space-x-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Spend ($)</label>
                      <input name="spend" type="number" step="0.01" defaultValue={metrics.spend} className="w-24 border border-gray-300 rounded-md p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ROAS</label>
                      <input name="roas" type="number" step="0.01" defaultValue={metrics.roas} className="w-24 border border-gray-300 rounded-md p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Clicks</label>
                      <input name="clicks" type="number" defaultValue={metrics.clicks} className="w-24 border border-gray-300 rounded-md p-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Conversions</label>
                      <input name="conversions" type="number" defaultValue={metrics.conversions} className="w-24 border border-gray-300 rounded-md p-1.5 text-sm" />
                    </div>
                    <button disabled={isUpdating === ad.id} type="submit" className="bg-black text-white px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 h-[34px]">
                      {isUpdating === ad.id ? 'Saving...' : 'Update Metrics'}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          {ads.length === 0 && <p className="text-gray-500">No ads found to track.</p>}
        </div>
      )}
    </div>
  );
}
