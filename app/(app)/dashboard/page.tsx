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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4">
      {/* Banner */}
      <div className="bg-[#13a884] rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px]">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-white/20 rounded-lg overflow-hidden border border-white/30 backdrop-blur-sm flex items-center justify-center">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={56} height={56} className="object-cover" />
            ) : (
              <span className="text-2xl font-bold">{profile?.full_name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-teal-50 font-medium">Xin chào 👋</p>
            <h2 className="text-lg font-bold">{profile?.full_name || 'Người dùng'}</h2>
            <p className="text-[10px] text-teal-100 mt-0.5">Editor · Outsource</p>
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-8 relative z-10">
          <div>
            <p className="text-[10px] text-teal-100/80 mb-1">Lương cơ bản</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider">
                {showSalary ? "5.000.000 ₫" : "••••••••"}
              </p>
              <button onClick={() => setShowSalary(!showSalary)} className="text-teal-100 hover:text-white transition">
                {showSalary ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-teal-100/80 mb-1">Trạng thái</p>
            <p className="text-xs font-bold">Chính thức</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-2 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-1">
            <Trophy className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Clip Win (Tháng)</p>
          <p className="text-lg font-bold text-gray-700">
            {metrics.win} <span className="text-xs font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-2 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1">
            <Scissors className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Đang xử lý</p>
          <p className="text-lg font-bold text-gray-700">
            {metrics.processing} <span className="text-xs font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-2 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-1">
            <CheckCircle2 className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Clip đã duyệt</p>
          <p className="text-lg font-bold text-gray-700">
            {metrics.approved} <span className="text-xs font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-2 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-1">
            <Target className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Điểm ADS TB (Tháng)</p>
          <p className="text-lg font-bold text-gray-700">
            {metrics.avgScore} <span className="text-xs font-normal text-gray-400 normal-case">/10</span>
          </p>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-2 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
            <Wallet className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Tổng lương (Tháng)</p>
          <p className="text-lg font-bold text-gray-700">
            {new Intl.NumberFormat("vi-VN").format(metrics.totalSalary)} <span className="text-xs font-normal text-gray-400 normal-case">₫</span>
          </p>
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-xs text-gray-300 font-medium capitalize">{currentDate}</p>
      </div>
    </div>
  );
}
