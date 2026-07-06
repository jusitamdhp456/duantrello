"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Trophy, Scissors, CheckCircle2, Target, Wallet, Eye, EyeOff, Upload } from 'lucide-react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';


export default function DashboardPage() {
  const { activeWorkspaceId, isLoading: wsLoading } = useWorkspace();
  const [isLoading, setIsLoading] = useState(true);
  const [showSalary, setShowSalary] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [metrics, setMetrics] = useState({
    processing: 0,
    approved: 0,
    totalSalary: 0,
    win: 0,
    avgScore: "0.0",
  });
  
  const [taskStatusData, setTaskStatusData] = useState<any[]>([]);
  const [tasksByDayData, setTasksByDayData] = useState<any[]>([]);
  
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
      if (profileData) {
        setEditName(profileData.full_name || "");
        setEditAvatarUrl(profileData.avatar_url || "");
      } else {
        setEditName(user.email?.split('@')[0] || "");
      }

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

        // Tính toán dữ liệu cho Biểu đồ tròn (Pie Chart - Task Status)
        if (tasks) {
          const statusCounts = {
            pending: 0,
            in_progress: 0,
            review: 0,
            completed: 0,
            cancelled: 0
          };
          tasks.forEach(t => {
            if (t.status === 'completed') statusCounts.completed++;
            else if (t.status === 'cancelled') statusCounts.cancelled++;
            else if (t.status === 'in_progress') statusCounts.in_progress++;
            else if (t.status === 'review' || t.review_status === 'review') statusCounts.review++;
            else statusCounts.pending++;
          });
          
          setTaskStatusData([
            { name: 'Mới', value: statusCounts.pending, color: '#94a3b8' },
            { name: 'Đang làm', value: statusCounts.in_progress, color: '#38bdf8' },
            { name: 'Chờ duyệt', value: statusCounts.review, color: '#f59e0b' },
            { name: 'Hoàn thành', value: statusCounts.completed, color: '#4ade80' },
            { name: 'Đã hủy', value: statusCounts.cancelled, color: '#f87171' }
          ].filter(d => d.value > 0));

          // Mocking tasks by day data for Bar Chart
          // Lấy 7 ngày gần nhất
          const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
              name: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
              date: d.toISOString().split('T')[0],
              HoànThành: 0,
              NhậnMới: 0
            };
          });

          // Fetch recent tasks to populate bar chart
          const { data: recentTasks } = await supabase
            .from('tasks')
            .select('created_at, status, updated_at')
            .eq('workspace_id', activeWorkspaceId)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          if (recentTasks) {
            recentTasks.forEach(rt => {
              const createdDate = rt.created_at.split('T')[0];
              const dayObj = last7Days.find(d => d.date === createdDate);
              if (dayObj) dayObj.NhậnMới++;

              if (rt.status === 'completed') {
                const updatedDate = rt.updated_at?.split('T')[0] || createdDate;
                const completedDayObj = last7Days.find(d => d.date === updatedDate);
                if (completedDayObj) completedDayObj.HoànThành++;
              }
            });
          }
          setTasksByDayData(last7Days);
        }
      }

      setIsLoading(false);
    }
    
    fetchDashboardData();
  }, [activeWorkspaceId, supabase]);

  if (wsLoading || isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-gray-500" /></div>;
  }

  const handleUpdateProfile = async () => {
    try {
      setIsSavingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from('profiles').upsert({ 
        id: user.id,
        email: user.email,
        full_name: editName,
        avatar_url: editAvatarUrl
      });
      
      if (error) throw error;
      
      setProfile((prev: any) => ({ ...prev, full_name: editName, avatar_url: editAvatarUrl }));
      setIsEditingProfile(false);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `user-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setEditAvatarUrl(data.publicUrl);
    } catch (error: any) {
      alert('Lỗi tải ảnh lên: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

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
        {isEditingProfile ? (
          <div className="flex flex-col gap-4 relative z-10 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20">
            <h3 className="font-bold text-lg">Cập nhật hồ sơ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">Ảnh đại diện</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="flex-1 w-full bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Nhập link URL hoặc..."
                  />
                  <label className="flex items-center justify-center bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/30 transition-colors" title="Tải ảnh lên">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button 
                onClick={handleUpdateProfile}
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-white text-purple-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="px-5 py-2.5 bg-black/20 text-white font-medium text-sm rounded-xl hover:bg-black/30 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-2xl overflow-hidden border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-inner shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-3xl font-bold">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div>
                <p className="text-sm text-purple-100 font-medium mb-1">Xin chào 👋</p>
                <h2 className="text-2xl font-bold tracking-wide">{profile?.full_name || 'Người dùng'}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <p className="text-xs text-purple-200 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">Editor · Outsource</p>
                  <p className="text-xs text-green-300 font-bold bg-green-500/20 px-3 py-1 rounded-full backdrop-blur-sm border border-green-400/30">Trạng thái: Chính thức</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full backdrop-blur-sm border border-white/20 transition-all self-start sm:self-center shrink-0"
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-[1.25rem] sm:rounded-2xl shadow-neu-convex p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-2xl bg-orange-50 flex items-center justify-center mb-0 sm:mb-1 shadow-inner border border-orange-100 shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-widest uppercase">Clip Win (Tháng)</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-700">
            {metrics.win} <span className="text-[10px] sm:text-sm font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-[1.25rem] sm:rounded-2xl shadow-neu-convex p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-2xl bg-blue-50 flex items-center justify-center mb-0 sm:mb-1 shadow-inner border border-blue-100 shrink-0">
            <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-widest uppercase">Đang xử lý</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-700">
            {metrics.processing} <span className="text-[10px] sm:text-sm font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-[1.25rem] sm:rounded-2xl shadow-neu-convex p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-2xl bg-purple-50 flex items-center justify-center mb-0 sm:mb-1 shadow-inner border border-purple-100 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-widest uppercase">Clip đã duyệt</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-700">
            {metrics.approved} <span className="text-[10px] sm:text-sm font-normal text-gray-400 normal-case">clip</span>
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-[1.25rem] sm:rounded-2xl shadow-neu-convex p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-neu-concave transition-all duration-300 transform hover:-translate-y-1 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-2xl bg-red-50 flex items-center justify-center mb-0 sm:mb-1 shadow-inner border border-red-100 shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
          </div>
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-widest uppercase truncate max-w-full">Điểm ADS TB</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-700">
            {metrics.avgScore} <span className="text-[10px] sm:text-sm font-normal text-gray-400 normal-case">/10</span>
          </p>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-[1.25rem] sm:rounded-2xl shadow-neu-convex p-4 sm:p-6 flex flex-col hover:shadow-neu-concave transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
              <Scissors className="w-4 h-4 text-blue-500" />
            </div>
            Tiến độ 7 ngày qua
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByDayData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="NhậnMới" name="Nhận mới" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="HoànThành" name="Hoàn thành" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[1.25rem] sm:rounded-2xl shadow-neu-convex p-4 sm:p-6 flex flex-col hover:shadow-neu-concave transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
              <Target className="w-4 h-4 text-purple-500" />
            </div>
            Tỷ lệ Trạng thái
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-400 flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-8 h-8 text-gray-200 mb-2" />
                <p>Chưa có dữ liệu trạng thái</p>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="text-center pt-8">
        <p className="text-sm text-gray-400 font-medium capitalize tracking-wide">{currentDate}</p>
      </div>
    </div>
  );
}
