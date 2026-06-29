"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const { activeWorkspaceId } = useWorkspace();
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

  if (!activeWorkspaceId) return <div className="p-8">Please select a workspace.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h1 className="text-3xl font-bold">Workspace Leaderboard</h1>
        <p className="text-gray-500 mt-2">Top performers</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center"><Loader2 className="animate-spin text-gray-500" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <h2 className="text-xl font-bold mb-4 flex items-center"><Medal className="w-5 h-5 mr-2 text-gray-700" /> Rankings</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scores.map((score, idx) => (
                    <tr key={score.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {score.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                        {score.total_score} pts
                      </td>
                    </tr>
                  ))}
                  {scores.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No scores yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Recent Awards</h2>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">{log.name}</span>
                    <span className="font-bold text-green-600">+{log.amount}</span>
                  </div>
                  <p className="text-gray-600">{log.reason}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {logs.length === 0 && <p className="text-gray-500 text-sm">No recent activity.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
