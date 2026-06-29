"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Trophy, Medal } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function LeaderboardPage() {
  const { activeWorkspaceId } = useWorkspace();
  const { t } = useLanguage();
  const [scores, setScores] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!activeWorkspaceId) return;
      setIsLoading(true);
      
      const { data: validScores } = await supabase
        .from('user_scores')
        .select('total_score, user_id')
        .eq('workspace_id', activeWorkspaceId)
        .order('total_score', { ascending: false });

      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
      
      const enrichedScores = validScores?.map(s => {
        const p = profiles?.find(pr => pr.id === s.user_id);
        return { ...s, name: p?.full_name || p?.email || 'Unknown User' };
      }) || [];

      const { data: scoreLogs } = await supabase
        .from('score_logs')
        .select('*')
        .eq('workspace_id', activeWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      const enrichedLogs = scoreLogs?.map(l => {
        const p = profiles?.find(pr => pr.id === l.user_id);
        return { ...l, name: p?.full_name || p?.email || 'Unknown User' };
      }) || [];

      setScores(enrichedScores);
      setLogs(enrichedLogs);
      setIsLoading(false);
    }
    fetchData();
  }, [activeWorkspaceId, supabase]);

  if (!activeWorkspaceId) return <div className="p-8">{t("select_workspace")}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-12 text-center">
        <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-6 drop-shadow-md" />
        <h1 className="text-5xl font-light text-gray-700 tracking-wide">{t("leaderboard_title")}</h1>
        <p className="text-gray-500 mt-4 text-lg font-medium">Top performers and active contributors</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-gray-700 tracking-wide"><Medal className="w-6 h-6 mr-3 text-indigo-400" /> {t("rankings")}</h2>
            <div className="bg-neu-base rounded-[2rem] shadow-neu-convex overflow-hidden p-8">
              <div className="space-y-6">
                {scores.map((score, idx) => (
                  <div key={score.user_id} className="flex justify-between items-center px-6 py-5 bg-neu-base shadow-neu-concave rounded-2xl transition-all hover:shadow-neu-convex">
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full shadow-neu-convex font-bold text-gray-500 text-lg">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-gray-700 text-xl tracking-wide">{score.name}</span>
                    </div>
                    <span className="font-bold text-blue-500 bg-neu-base shadow-neu-convex px-6 py-3 rounded-full text-sm uppercase tracking-widest">
                      {score.total_score} pts
                    </span>
                  </div>
                ))}
                {scores.length === 0 && (
                  <p className="text-center text-gray-500 py-10 font-medium">No scores yet. Complete tasks to earn points!</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 tracking-wide">{t("recent_awards")}</h2>
            <div className="space-y-6">
              {logs.map(log => (
                <div key={log.id} className="bg-neu-base p-6 rounded-[1.5rem] shadow-neu-convex text-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-700 tracking-wide">{log.name}</span>
                    <span className="font-bold text-green-500 px-3 py-1 bg-neu-base shadow-neu-concave rounded-lg">+{log.amount} pts</span>
                  </div>
                  <p className="text-gray-600 font-medium leading-relaxed">{log.reason}</p>
                  <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-semibold">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {logs.length === 0 && <p className="text-gray-500 text-sm p-6 bg-neu-base shadow-neu-concave rounded-[1.5rem] text-center font-medium">No recent activity.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
