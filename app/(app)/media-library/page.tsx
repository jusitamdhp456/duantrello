"use client";

import UploadForm from '@/components/media/UploadForm';
import MediaAssetCard from '@/components/media/MediaAssetCard';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useWorkspace } from '@/components/providers/WorkspaceProvider';

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { t } = useLanguage();
  const { activeWorkspaceId } = useWorkspace();
  
  useEffect(() => {
    async function fetchData() {
      if (!activeWorkspaceId) return;

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: fetchedAssets } = await supabase
          .from('media_assets')
          .select('*')
          .eq('workspace_id', activeWorkspaceId)
          .order('created_at', { ascending: false });
        setAssets(fetchedAssets || []);
      }
    }
    fetchData();
  }, [supabase, activeWorkspaceId]);

  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const totalStorageBytes = assets.reduce((acc, curr) => acc + (curr.file_size || 0), 0);
  const totalStorageMB = (totalStorageBytes / 1024 / 1024).toFixed(2);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <h1 className="text-4xl font-light text-gray-700 tracking-wide">{t("media_title")}</h1>
        {assets.length > 0 && (
          <div className="bg-neu-base shadow-neu-concave px-6 py-3 rounded-full flex items-center">
            <span className="text-sm text-gray-500 font-semibold uppercase tracking-widest mr-3">{t("storage_used")}:</span>
            <span className="text-lg font-bold text-indigo-500">{totalStorageMB} MB</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {(!assets || assets.length === 0) ? (
            <div className="bg-neu-base shadow-neu-concave rounded-[2rem] p-12 text-center">
              <h3 className="text-xl font-medium text-gray-700 tracking-wide">{t("no_media")}</h3>
              <p className="mt-4 text-sm text-gray-500">
                Upload your first video, image, or audio file to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {assets.map((asset) => (
                <MediaAssetCard key={asset.id} asset={asset} onDelete={handleDeleteAsset} />
              ))}
            </div>
          )}
        </div>
        
        <div>
          <UploadForm />
          
          {!user && (
            <div className="mt-6 p-6 bg-neu-base shadow-neu-concave text-yellow-600 rounded-[2rem] text-sm font-medium">
              <strong>Chú ý:</strong> Bạn chưa đăng nhập. Việc upload sẽ thất bại do vi phạm Row Level Security (RLS).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
