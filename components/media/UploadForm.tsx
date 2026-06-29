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
    <div className="border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 max-w-md w-full">
      <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Media</h3>
      <p className="text-sm text-gray-500 mb-4 text-center">
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
        className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition"
      >
        Select File
      </label>

      {file && (
        <div className="mt-4 w-full bg-white p-3 rounded border border-gray-200 text-sm flex justify-between items-center">
          <span className="truncate max-w-[200px]">{file.name}</span>
          <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-4 w-full flex items-center justify-center bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload to R2"
          )}
        </button>
      )}

      {status === "success" && (
        <div className="mt-4 flex items-center text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          Upload completed successfully!
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 flex flex-col items-center text-red-600 text-sm text-center">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Upload failed
          </div>
          <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
