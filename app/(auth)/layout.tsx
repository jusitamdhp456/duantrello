export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neu-base py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-neu-base p-10 rounded-[2.5rem] shadow-neu-convex">
        {children}
      </div>
    </div>
  );
}
