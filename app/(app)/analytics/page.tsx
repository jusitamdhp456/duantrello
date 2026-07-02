"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveAdMetrics } from '@/app/actions/performance';
import { getWorkspaceMetrics } from '@/app/actions/analytics';
import { Loader2, TrendingUp, DollarSign, MousePointerClick, Eye, Activity } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function AnalyticsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const { t } = useLanguage();
  const [ads, setAds] = useState<any[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, any>>({});
  const [totals, setTotals] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!activeWorkspaceId) return;
      setIsLoading(true);
      
      const workspaceTotals = await getWorkspaceMetrics(activeWorkspaceId);
      setTotals(workspaceTotals);
      
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
      // reload totals
      const workspaceTotals = await getWorkspaceMetrics(activeWorkspaceId);
      setTotals(workspaceTotals);
      alert('Metrics updated successfully');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  if (!activeWorkspaceId) return <div className="p-8">{t("select_workspace")}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light text-gray-700 flex items-center tracking-wide">
            <div className="p-3 rounded-full shadow-neu-convex mr-4">
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            {t("analytics_title")}
          </h1>
          <p className="text-gray-500 text-sm mt-4 ml-1">Track overall performance and individual video ad metrics</p>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-gray-500 w-8 h-8 mx-auto" />
      ) : (
        <>
          {/* Workspace Totals Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-neu-base rounded-3xl p-6 shadow-neu-convex flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-full shadow-neu-concave text-purple-500 mb-4"><DollarSign className="w-5 h-5"/></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Spend</p>
              <p className="text-2xl font-black text-gray-700">${totals?.totalSpend?.toFixed(2) || 0}</p>
            </div>
            <div className="bg-neu-base rounded-3xl p-6 shadow-neu-convex flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-full shadow-neu-concave text-green-500 mb-4"><Activity className="w-5 h-5"/></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Avg ROAS</p>
              <p className="text-2xl font-black text-green-500">{totals?.averageRoas?.toFixed(2) || 0}x</p>
            </div>
            <div className="bg-neu-base rounded-3xl p-6 shadow-neu-convex flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-full shadow-neu-concave text-purple-500 mb-4"><Eye className="w-5 h-5"/></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Impressions</p>
              <p className="text-2xl font-black text-gray-700">{totals?.totalImpressions || 0}</p>
            </div>
            <div className="bg-neu-base rounded-3xl p-6 shadow-neu-convex flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-full shadow-neu-concave text-orange-500 mb-4"><MousePointerClick className="w-5 h-5"/></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Clicks</p>
              <p className="text-2xl font-black text-gray-700">{totals?.totalClicks || 0}</p>
            </div>
          </div>

          {/* Individual Ads Metrics */}
          <h2 className="text-2xl font-bold text-gray-700 mb-6 tracking-wide ml-2">Video Ads Performance</h2>
          <div className="space-y-10">
            {ads.map(ad => {
              const metrics = metricsMap[ad.id] || {};
              return (
                <div key={ad.id} className="bg-neu-base rounded-[2rem] shadow-neu-convex overflow-hidden p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-semibold text-2xl text-gray-700 tracking-wide">{ad.title}</h3>
                      <p className="text-sm text-gray-500 mt-2 font-medium">
                        <span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-full mr-2">{ad.platform}</span>
                        <span className="px-3 py-1 bg-neu-base shadow-neu-concave rounded-full">{ad.approval_status}</span>
                      </p>
                    </div>
                    <div className="flex space-x-6">
                      <div className="text-center bg-neu-base shadow-neu-concave px-6 py-4 rounded-2xl">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t("spend")}</p>
                        <p className="font-bold text-gray-700 text-xl">${metrics.spend || 0}</p>
                      </div>
                      <div className="text-center bg-neu-base shadow-neu-concave px-6 py-4 rounded-2xl">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t("roas")}</p>
                        <p className="font-bold text-green-500 text-xl">{metrics.roas || 0}x</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-300/30">
                    <form onSubmit={(e) => handleSaveMetrics(e, ad.id)} className="flex items-end space-x-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 ml-1">{t("spend")} ($)</label>
                        <input name="spend" type="number" step="0.01" defaultValue={metrics.spend} className="w-28 bg-neu-base shadow-neu-concave rounded-xl px-4 py-3 text-sm text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-purple-400/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 ml-1">{t("roas")}</label>
                        <input name="roas" type="number" step="0.01" defaultValue={metrics.roas} className="w-28 bg-neu-base shadow-neu-concave rounded-xl px-4 py-3 text-sm text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-purple-400/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 ml-1">{t("clicks")}</label>
                        <input name="clicks" type="number" defaultValue={metrics.clicks} className="w-28 bg-neu-base shadow-neu-concave rounded-xl px-4 py-3 text-sm text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-purple-400/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 ml-1">Conversions</label>
                        <input name="conversions" type="number" defaultValue={metrics.conversions} className="w-28 bg-neu-base shadow-neu-concave rounded-xl px-4 py-3 text-sm text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-purple-400/50" />
                      </div>
                      <button disabled={isUpdating === ad.id} type="submit" className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-full text-sm font-medium shadow-neu-convex active:shadow-neu-pressed disabled:opacity-50 transition-all duration-200">
                        {isUpdating === ad.id ? t("loading") : t("update_metrics")}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
            {ads.length === 0 && <p className="text-gray-500">{t("no_data")}</p>}
          </div>
        </>
      )}
    </div>
  );
}
