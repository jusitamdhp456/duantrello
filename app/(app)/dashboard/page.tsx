"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, DollarSign, TrendingUp, CheckCircle, Video, Star, ListTodo } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeWorkspaceId, isLoading: wsLoading } = useWorkspace();
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
  if (!activeWorkspaceId) return <div className="p-8">Please select a workspace.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Insights Dashboard</h1>
        <p className="text-gray-500 mt-2">Overview of your creative OS performance</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500 w-8 h-8" /></div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center text-gray-500 mb-2">
                <DollarSign className="w-5 h-5 mr-2 text-indigo-500" />
                <span className="text-sm font-medium uppercase tracking-wider">Total Spend</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">${metrics.totalSpend.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center text-gray-500 mb-2">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                <span className="text-sm font-medium uppercase tracking-wider">Avg ROAS</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{metrics.avgRoas.toFixed(2)}x</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center text-gray-500 mb-2">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
                <span className="text-sm font-medium uppercase tracking-wider">Approved Ads</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.adsApproved}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center text-gray-500 mb-2">
                <Video className="w-5 h-5 mr-2 text-yellow-500" />
                <span className="text-sm font-medium uppercase tracking-wider">Ads in Review</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.adsReview}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center"><Star className="w-5 h-5 mr-2 text-yellow-500" /> Top Performers</h3>
                <Link href="/leaderboard" className="text-sm text-indigo-600 hover:underline font-medium">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {topPerformers.map((p, idx) => (
                  <div key={p.user_id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-400 w-4">#{idx + 1}</span>
                      <span className="font-semibold text-gray-900">{p.name}</span>
                    </div>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm">{p.total_score} pts</span>
                  </div>
                ))}
                {topPerformers.length === 0 && <p className="px-6 py-8 text-center text-gray-500 text-sm">No scores yet. Approve an ad to award points!</p>}
              </div>
            </div>

            {/* Active Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center"><ListTodo className="w-5 h-5 mr-2 text-blue-500" /> Active Tasks</h3>
                <Link href="/boards" className="text-sm text-indigo-600 hover:underline font-medium">Go to Boards</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {tasks.map((t) => (
                  <div key={t.id} className="px-6 py-4 hover:bg-gray-50 transition">
                    <h4 className="font-medium text-gray-900 mb-1">{t.title}</h4>
                    <p className="text-xs text-gray-500">
                      In <span className="font-medium text-gray-700">{t.listName}</span>
                    </p>
                  </div>
                ))}
                {tasks.length === 0 && <p className="px-6 py-8 text-center text-gray-500 text-sm">No active tasks. Create a brief and generate tasks!</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
