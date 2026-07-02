"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Trophy, Scissors, CheckCircle2, Target, Wallet, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const { activeWorkspaceId, isLoading: wsLoading } = useWorkspace();
  const [isLoading, setIsLoading] = useState(true);
  const [showSalary, setShowSalary] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    processing: 0,
    approved: 0,
    totalSalary: 0,
    win: 0,
    avgScore: "0.0",
  });
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setProfile(profileData || { full_name: user.email?.split('@')[0] });

      const now = new Date();
      const viewYear = now.getFullYear();
      const viewMonth = now.getMonth() + 1;

      // Fetch Tasks (Đang xử lý)
      if (activeWorkspaceId) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, review_status, status')
          .eq('workspace_id', activeWorkspaceId)
          .eq('assignee_name', profileData?.full_name || user.email?.split('@')[0]);
          
        const processing = tasks?.filter(t => t.review_status !== 'approved' && t.status !== 'completed').length || 0;
        
        // Fetch Salary Records for this month (Đã duyệt & Lương)
        const { data: salaryRecords } = await supabase
          .from('salary_records')
          .select('rate_per_clip')
          .eq('user_id', user.id)
          .eq('period_year', viewYear)
          .eq('period_month', viewMonth);
          
        const approved = salaryRecords?.length || 0;
        const totalSalary = salaryRecords?.reduce((sum, r) => sum + r.rate_per_clip, 0) || 0;

        setMetrics({
          processing,
          approved,
          totalSalary,
          win: 0,
          avgScore: "0.0",
        });
      }

      setIsLoading(false);
    }
    
    fetchDashboardData();
  }, [activeWorkspaceId, supabase]);

  if (wsLoading || isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-gray-500" /></div>;
  }

  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-4 md:p-8 w-full mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] p-8 text-white shadow-neu-convex relative overflow-hidden flex flex-col justify-between min-h-[160px]">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl overflow-hidden border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-inner">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={64} height={64} className="object-cover" />
            ) : (
              <span className="text-3xl font-bold">{profile?.full_name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-sm text-purple-100 font-medium mb-1">Xin chào 👋</p>
            <h2 className="text-2xl font-bold tracking-wide">{profile?.full_name || 'Người dùng'}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-xs text-purple-200 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">Editor · Outsource</p>
              <p className="text-xs text-green-300 font-bold bg-green-500/20 px-3 py-1 rounded-full backdrop-blur-sm border border-green-400/30">Trạng thái: Chính thức</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl shadow-neu-convex p-6 flex flex-col items-center justify-center gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-1 shadow-inner border border-orange-100">
            <Trophy className="w-6 h-6 text-orange-400" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Clip Win (Tháng)</p>
          <p className="text-2xl font-bold text-gray-700">
            {metrics.win} <span className="text-sm font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl shadow-neu-convex p-6 flex flex-col items-center justify-center gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-1 shadow-inner border border-blue-100">
            <Scissors className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Đang xử lý</p>
          <p className="text-2xl font-bold text-gray-700">
            {metrics.processing} <span className="text-sm font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl shadow-neu-convex p-6 flex flex-col items-center justify-center gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-1 shadow-inner border border-purple-100">
            <CheckCircle2 className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Clip đã duyệt</p>
          <p className="text-2xl font-bold text-gray-700">
            {metrics.approved} <span className="text-sm font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl shadow-neu-convex p-6 flex flex-col items-center justify-center gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-1 shadow-inner border border-red-100">
            <Target className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Điểm ADS TB (Tháng)</p>
          <p className="text-2xl font-bold text-gray-700">
            {metrics.avgScore} <span className="text-sm font-normal text-gray-400 normal-case">/10</span>
          </p>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-2xl shadow-neu-convex p-6 flex flex-col items-center justify-center gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-1 shadow-inner border border-emerald-100">
            <Wallet className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Tổng lương (Tháng)</p>
          <p className="text-2xl font-bold text-purple-600">
            {new Intl.NumberFormat("vi-VN").format(metrics.totalSalary)} <span className="text-sm font-normal text-gray-400 normal-case">₫</span>
          </p>
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-sm text-gray-400 font-medium capitalize tracking-wide">{currentDate}</p>
      </div>
    </div>
  );
}
