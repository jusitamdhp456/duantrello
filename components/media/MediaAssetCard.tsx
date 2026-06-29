"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getMediaUrl, deleteMediaAsset } from "@/app/actions/media";
import { Loader2, Download, Trash2, File, Image as ImageIcon, Video, Music } from "lucide-react";

interface MediaAssetCardProps {
  asset: any;
  onDelete: (id: string) => void;
}

export default function MediaAssetCard({ asset, onDelete }: MediaAssetCardProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchUrl() {
      try {
        const presignedUrl = await getMediaUrl(asset.r2_object_key);
        setUrl(presignedUrl);
      } catch (err) {
        console.error("Failed to load preview URL", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUrl();
  }, [asset.r2_object_key]);

  const handleDelete = async () => {
    if (!confirm(t("delete_asset_confirm"))) return;
    setIsDeleting(true);
    try {
      await deleteMediaAsset(asset.id, asset.r2_object_key);
      onDelete(asset.id);
    } catch (err) {
      console.error(err);
      alert(t("error"));
      setIsDeleting(false);
    }
  };

  const getIcon = () => {
    if (asset.file_type.includes("image")) return <ImageIcon className="w-8 h-8 text-gray-400" />;
    if (asset.file_type.includes("video")) return <Video className="w-8 h-8 text-gray-400" />;
    if (asset.file_type.includes("audio")) return <Music className="w-8 h-8 text-gray-400" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-neu-base/50">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      );
    }

    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-neu-base/50">
          {getIcon()}
        </div>
      );
    }

    if (asset.file_type.includes("image")) {
      return (
        <img 
          src={url} 
          alt={asset.file_name} 
          className="w-full h-full object-cover" 
          loading="lazy"
        />
      );
    }

    if (asset.file_type.includes("video")) {
      return (
        <video 
          src={url} 
          controls={false}
          muted
          className="w-full h-full object-cover"
        />
      );
    }
    
    // For audio and others, just show icon
    return (
      <div className="w-full h-full flex items-center justify-center bg-neu-base/50">
        {getIcon()}
      </div>
    );
  };

  return (
    <div className="bg-neu-base shadow-neu-convex rounded-[1.5rem] p-5 transition-all duration-200 hover:shadow-neu-concave group flex flex-col">
      <div className="aspect-video bg-neu-base shadow-neu-concave rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
        {renderPreview()}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-bold tracking-widest uppercase">
          {asset.file_type.split('/')[1] || asset.asset_type}
        </div>
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700 truncate tracking-wide" title={asset.file_name}>
          {asset.file_name}
        </p>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          {(asset.file_size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        {url && (
          <a
            href={url}
            download={asset.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center bg-neu-base shadow-neu-convex hover:shadow-neu-concave text-blue-500 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Download className="w-4 h-4 mr-1" /> {t("download")}
          </a>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center justify-center bg-neu-base shadow-neu-convex hover:shadow-neu-concave text-red-500 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
