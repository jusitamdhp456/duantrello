"use client";

import { useWorkspace } from '@/components/providers/WorkspaceProvider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createCampaign } from '@/app/actions/campaigns';
import { Loader2, Plus, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function CampaignsPage() {
  const { activeWorkspaceId } = useWorkspace();
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchCampaigns() {
      if (!activeWorkspaceId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', activeWorkspaceId)
        .order('created_at', { ascending: false });
      setCampaigns(data || []);
      setIsLoading(false);
    }
    fetchCampaigns();
  }, [activeWorkspaceId, supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeWorkspaceId) return;
    try {
      const newCampaign = await createCampaign(activeWorkspaceId, name, budget, startDate, endDate);
      setCampaigns([newCampaign, ...campaigns]);
      setName('');
      setBudget(0);
      setStartDate('');
      setEndDate('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeWorkspaceId) return <div className="p-8">{t("select_workspace")}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-light text-gray-700 tracking-wide">{t("campaigns_title")}</h1>
        <button onClick={() => setIsAdding(true)} className="bg-neu-base text-gray-600 px-6 py-3 rounded-full shadow-neu-convex hover:shadow-neu-concave text-sm font-bold transition-all duration-200 uppercase tracking-widest flex items-center">
          <Plus className="w-5 h-5 mr-2" /> {t("new_campaign")}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="mb-10 bg-neu-base p-8 rounded-[2rem] shadow-neu-convex border-none max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-2">{t("campaign_name")}</label>
              <input 
                type="text" 
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summer Sale 2026..."
                className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-2 flex items-center"><DollarSign className="w-4 h-4 mr-1"/> Ngân sách</label>
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-2 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Bắt đầu</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-2 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Kết thúc</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium"
                />
              </div>
            </div>
          </div>
          <div className="flex space-x-4">
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-neu-convex active:shadow-neu-pressed transition-all">{t("save")}</button>
            <button type="button" onClick={() => setIsAdding(false)} className="bg-neu-base text-gray-500 px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave transition-all">{t("cancel")}</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-500 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map(c => (
            <div key={c.id} className="bg-neu-base p-8 rounded-[2rem] shadow-neu-convex hover:shadow-neu-concave transition-all duration-300">
              <h3 className="font-semibold text-2xl text-gray-700 tracking-wide truncate mb-4" title={c.name}>{c.name}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-neu-base shadow-neu-concave p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Ngân sách</p>
                  <p className="text-gray-700 font-bold">${c.budget || 0}</p>
                </div>
                <div className="bg-neu-base shadow-neu-concave p-3 rounded-xl text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Trạng thái</p>
                  <p className={`font-bold text-sm ${c.status === 'active' ? 'text-green-500' : 'text-gray-500'}`}>{c.status}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 bg-neu-base shadow-neu-convex px-4 py-2 rounded-lg">
                <span>{c.start_date || '--'}</span>
                <span>đến</span>
                <span>{c.end_date || '--'}</span>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && <p className="text-gray-500 col-span-full">{t("no_data")}</p>}
        </div>
      )}
    </div>
  );
}
