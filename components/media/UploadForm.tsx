"use client";

import { useState } from "react";
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  const { activeWorkspaceId } = useWorkspace();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      // 1. Get Presigned URL
      const presignRes = await fetch("/api/r2/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          workspaceId: activeWorkspaceId,
        }),
      });

      if (!presignRes.ok) {
        const errorData = await presignRes.json();
        throw new Error(errorData.error || "Failed to get presigned URL");
      }

      const { url, objectKey, bucket } = await presignRes.json();

      // 2. Upload file directly to R2
      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to Cloudflare R2");
      }

      // 3. Save metadata to Supabase
      const completeRes = await fetch("/api/assets/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          objectKey,
          bucket,
        }),
      });

      if (!completeRes.ok) {
        const errorData = await completeRes.json();
        throw new Error(errorData.error || "Failed to save metadata");
      }

      setStatus("success");
      setFile(null);
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-[2rem] p-10 flex flex-col items-center justify-center bg-neu-base shadow-neu-concave max-w-md w-full">
      <UploadCloud className="w-14 h-14 text-indigo-400 mb-6 drop-shadow-sm" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2 tracking-wide">Upload Media</h3>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Select a file to upload directly to Cloudflare R2
      </p>
      
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <label
        htmlFor="file-upload"
        className="cursor-pointer bg-neu-base text-gray-600 px-8 py-3 rounded-full shadow-neu-convex hover:shadow-neu-concave text-sm font-semibold transition-all duration-200 uppercase tracking-widest"
      >
        Select File
      </label>

      {file && (
        <div className="mt-6 w-full bg-neu-base p-4 rounded-2xl shadow-neu-convex text-sm flex justify-between items-center text-gray-700 font-medium">
          <span className="truncate max-w-[200px]">{file.name}</span>
          <span className="text-gray-500 bg-neu-base shadow-neu-concave px-2 py-1 rounded-md">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-6 w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full text-sm font-bold tracking-wider uppercase shadow-neu-convex hover:shadow-neu-concave disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload to R2"
          )}
        </button>
      )}

      {status === "success" && (
        <div className="mt-6 flex items-center text-green-500 font-medium text-sm bg-neu-base shadow-neu-concave px-4 py-2 rounded-xl">
          <CheckCircle className="w-5 h-5 mr-2" />
          Upload completed successfully!
        </div>
      )}

      {status === "error" && (
        <div className="mt-6 flex flex-col items-center text-red-500 text-sm text-center bg-neu-base shadow-neu-concave p-4 rounded-xl">
          <div className="flex items-center font-medium">
            <AlertCircle className="w-5 h-5 mr-2" />
            Upload failed
          </div>
          <p className="mt-2 text-xs text-red-400">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
