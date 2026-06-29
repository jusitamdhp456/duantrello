"use client";

import UploadForm from '@/components/media/UploadForm';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { t } = useLanguage();
  
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: fetchedAssets } = await supabase
          .from('media_assets')
          .select('*')
          .order('created_at', { ascending: false });
        setAssets(fetchedAssets || []);
      }
    }
    fetchData();
  }, [supabase]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-light text-gray-700 tracking-wide">{t("media_title")}</h1>
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
                <div key={asset.id} className="bg-neu-base shadow-neu-convex rounded-[1.5rem] p-5 transition-all duration-200 hover:shadow-neu-concave">
                  <div className="aspect-video bg-neu-base shadow-neu-concave rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-gray-400 uppercase font-semibold tracking-widest">{asset.asset_type}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 truncate tracking-wide" title={asset.file_name}>{asset.file_name}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">{(asset.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
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
