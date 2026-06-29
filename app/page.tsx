import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col gap-4">
        <h1 className="text-4xl font-bold">Marketing Creative OS</h1>
        <p className="text-lg text-gray-500 text-center max-w-2xl">
          Quản lý toàn bộ vòng đời sản xuất creative: từ ý tưởng, brief, quay chụp đến chỉnh sửa và đánh giá hiệu quả.
        </p>
        <div className="flex gap-4 mt-8">
          <Link href="/dashboard" className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
            Go to Dashboard
          </Link>
          <Link href="/media-library" className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition">
            Media Library
          </Link>
        </div>
      </div>
    </main>
  );
}
