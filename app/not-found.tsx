import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1e] text-[#f1f5f9] text-center p-10">
      <div className="text-[120px] font-black text-primary leading-none font-mono">
        404
      </div>
      <h1 className="text-3xl font-bold font-outfit mt-4 mb-4">
        Page not found
      </h1>
      <p className="text-[#94a3b8] max-w-sm mb-10 leading-relaxed font-mono text-sm">
        This page doesn't exist. Your study abroad journey continues on the dashboard.
      </p>
      <Link
        href="/dashboard"
        className="bg-primary text-background px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_#f59e0b30]"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
