import UploadForm from '@/components/media/UploadForm';
import { createClient } from '@/lib/supabase/server';

export default async function MediaLibraryPage() {
  const supabase = createClient();
  
  // Lấy thông tin user hiện tại (nếu có)
  const { data: { user } } = await supabase.auth.getUser();
  
  // Lấy danh sách media assets. Nếu chưa login, kết quả sẽ trống do RLS chặn.
  const { data: assets } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {(!assets || assets.length === 0) ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900">No media assets yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Upload your first video, image, or audio file to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-gray-400 uppercase font-medium">{asset.asset_type}</span>
                  </div>
                  <p className="text-sm font-medium truncate" title={asset.file_name}>{asset.file_name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(asset.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <UploadForm />
          
          {!user && (
            <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm border border-yellow-200">
              <strong>Chú ý:</strong> Bạn chưa đăng nhập. Việc upload sẽ thất bại ở bước lưu Supabase do vi phạm Row Level Security (RLS). Vui lòng cấu hình `.env.local` và tạo một user test.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
