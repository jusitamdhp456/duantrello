"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, DollarSign, TrendingUp, CheckCircle, Video, Star, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function DashboardPage() {
  const { activeWorkspaceId, isLoading: wsLoading } = useWorkspace();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState({ totalSpend: 0, avgRoas: 0, adsApproved: 0, adsReview: 0 });
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      if (!activeWorkspaceId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      
      // 1. Fetch Ad Metrics
      const { data: adMetrics } = await supabase
        .from('ad_metrics')
        .select('spend, roas')
        .eq('workspace_id', activeWorkspaceId);
        
      let totalSpend = 0;
      let totalRoas = 0;
      if (adMetrics && adMetrics.length > 0) {
        adMetrics.forEach(m => {
          totalSpend += Number(m.spend || 0);
          totalRoas += Number(m.roas || 0);
        });
        totalRoas = totalRoas / adMetrics.length;
      }

      // 2. Fetch Video Ads status
      const { data: videoAds } = await supabase
        .from('video_ads')
        .select('approval_status')
        .eq('workspace_id', activeWorkspaceId);
        
      const approved = videoAds?.filter(a => a.approval_status === 'approved').length || 0;
      const review = videoAds?.filter(a => a.approval_status === 'review').length || 0;

      setMetrics({ totalSpend, avgRoas: totalRoas, adsApproved: approved, adsReview: review });

      // 3. Fetch Top Performers
      const { data: scores } = await supabase
        .from('user_scores')
        .select('total_score, user_id')
        .eq('workspace_id', activeWorkspaceId)
        .order('total_score', { ascending: false })
        .limit(3);
        
      if (scores && scores.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
        const enrichedScores = scores.map(s => {
          const p = profiles?.find(pr => pr.id === s.user_id);
          return { ...s, name: p?.full_name || p?.email || 'Unknown User' };
        });
        setTopPerformers(enrichedScores);
      } else {
        setTopPerformers([]);
      }

      // 4. Fetch Tasks (from 'To Do' or 'In Progress' lists)
      const { data: boards } = await supabase
        .from('boards')
        .select('id')
        .eq('workspace_id', activeWorkspaceId);
        
      const boardIds = boards?.map(b => b.id) || [];
      if (boardIds.length > 0) {
        const { data: lists } = await supabase
          .from('lists')
          .select('id, name')
          .in('board_id', boardIds)
          .in('name', ['To Do', 'In Progress']);
          
        const listIds = lists?.map(l => l.id) || [];
        if (listIds.length > 0) {
          const { data: cards } = await supabase
            .from('cards')
            .select('id, title, list_id')
            .in('list_id', listIds)
            .limit(5);
            
          const enrichedCards = cards?.map(c => {
             const list = lists?.find(l => l.id === c.list_id);
             return { ...c, listName: list?.name };
          });
          setTasks(enrichedCards || []);
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }

      setIsLoading(false);
    }
    
    fetchDashboardData();
  }, [activeWorkspaceId, supabase]);

  if (wsLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;
  if (!activeWorkspaceId) return <div className="p-8">{t("select_workspace")}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-light text-gray-700 tracking-wide">{t("dashboard_title")}</h1>
        <p className="text-gray-500 mt-2">{t("welcome")}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500 w-8 h-8" /></div>
      ) : (
        <div className="space-y-10">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-neu-base p-8 rounded-[2rem] shadow-neu-convex flex flex-col justify-center">
              <div className="flex items-center text-gray-500 mb-4">
                <div className="p-3 rounded-full shadow-neu-convex mr-3">
                  <DollarSign className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest">{t("spend")}</span>
              </div>
              <p className="text-3xl font-light text-gray-700">${metrics.totalSpend.toFixed(2)}</p>
            </div>
            
            <div className="bg-neu-base p-8 rounded-[2rem] shadow-neu-convex flex flex-col justify-center">
              <div className="flex items-center text-gray-500 mb-4">
                <div className="p-3 rounded-full shadow-neu-convex mr-3">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest">{t("roas")}</span>
              </div>
              <p className="text-3xl font-light text-purple-600">{metrics.avgRoas.toFixed(2)}x</p>
            </div>

            <div className="bg-neu-base p-8 rounded-[2rem] shadow-neu-convex flex flex-col justify-center">
              <div className="flex items-center text-gray-500 mb-4">
                <div className="p-3 rounded-full shadow-neu-convex mr-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest">{t("status")}</span>
              </div>
              <p className="text-3xl font-light text-gray-700">{metrics.adsApproved}</p>
            </div>

            <div className="bg-neu-base p-8 rounded-[2rem] shadow-neu-convex flex flex-col justify-center">
              <div className="flex items-center text-gray-500 mb-4">
                <div className="p-3 rounded-full shadow-neu-convex mr-3">
                  <Video className="w-5 h-5 text-yellow-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest">{t("status")}</span>
              </div>
              <p className="text-3xl font-light text-gray-700">{metrics.adsReview}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Top Performers */}
            <div className="bg-neu-base rounded-[2rem] shadow-neu-convex overflow-hidden p-6">
              <div className="px-4 py-4 flex justify-between items-center mb-4">
                <h3 className="font-semibold text-xl text-gray-700 flex items-center tracking-wide"><Star className="w-6 h-6 mr-3 text-yellow-500 drop-shadow-sm" /> {t("nav_leaderboard")}</h3>
                <Link href="/leaderboard" className="text-sm px-4 py-2 rounded-full shadow-neu-convex hover:shadow-neu-concave text-purple-600 font-medium transition-all duration-200">{t("nav_leaderboard")}</Link>
              </div>
              <div className="space-y-4 px-2 pb-2">
                {topPerformers.map((p, idx) => (
                  <div key={p.user_id} className="px-6 py-5 rounded-[1.5rem] shadow-neu-concave flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full shadow-neu-convex font-bold text-gray-500">{idx + 1}</div>
                      <span className="font-medium text-gray-700 text-lg">{p.name}</span>
                    </div>
                    <span className="font-bold text-purple-600 shadow-neu-convex bg-neu-base px-4 py-2 rounded-full text-sm">{p.total_score} {t("pts")}</span>
                  </div>
                ))}
                {topPerformers.length === 0 && <p className="py-8 text-center text-gray-500 text-sm">{t("no_scores")}</p>}
              </div>
            </div>

            {/* Active Tasks */}
            <div className="bg-neu-base rounded-[2rem] shadow-neu-convex overflow-hidden p-6">
              <div className="px-4 py-4 flex justify-between items-center mb-4">
                <h3 className="font-semibold text-xl text-gray-700 flex items-center tracking-wide"><ListTodo className="w-6 h-6 mr-3 text-indigo-500 drop-shadow-sm" /> {t("recent_tasks")}</h3>
                <Link href="/boards" className="text-sm px-4 py-2 rounded-full shadow-neu-convex hover:shadow-neu-concave text-purple-600 font-medium transition-all duration-200">{t("nav_boards")}</Link>
              </div>
              <div className="space-y-4 px-2 pb-2">
                {tasks.map((t) => (
                  <div key={t.id} className="px-6 py-5 rounded-[1.5rem] shadow-neu-concave transition">
                    <h4 className="font-medium text-gray-700 mb-1">{t.title}</h4>
                    <p className="text-xs text-gray-500">
                      In <span className="font-medium px-2 py-1 bg-neu-base shadow-neu-convex rounded-full ml-1 text-gray-600">{t.listName}</span>
                    </p>
                  </div>
                ))}
                {tasks.length === 0 && <p className="py-8 text-center text-gray-500 text-sm">{t("no_data")}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
