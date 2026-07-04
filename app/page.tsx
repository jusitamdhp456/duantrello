import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden" 
      style={{
        background: 'radial-gradient(circle at center, #2C4B8C 0%, #1A2E5E 50%, #0D1B3E 100%)'
      }}
    >
      <div className="flex flex-col items-center justify-center z-10 w-full max-w-md px-6">
        
        {/* Animated Logo */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-20 animate-float">
          <Image
            src="/logo.png" 
            alt="Logo Intro"
            fill
            className="object-contain animate-wink drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            priority
          />
        </div>

        {/* Enter Button */}
        <div className="absolute bottom-16 md:bottom-24 w-full flex justify-center">
          <Link 
            href="/dashboard" 
            className="px-10 py-3 rounded-full text-white/90 text-sm md:text-base font-semibold tracking-wide transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            Chạm để mở
          </Link>
        </div>
        
      </div>
    </main>
  );
}
