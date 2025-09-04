// src/app/login/page.tsx
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#F3E9D9] text-zinc-900">
      {/* Outer container */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden border border-black/10">
          
          {/* Left section: branding + welcome text */}
          <section className="bg-[#F3C8A5]/95 p-8 sm:p-12 relative">
            {/* Divider line */}
            <div className="hidden lg:block absolute right-0 top-0 h-full w-px bg-black/20" />

            {/* Placeholder for logo image */}
            <div className="mb-10 flex items-center gap-4">
              <div className="h-16 w-16 bg-white/50 rounded-md flex items-center justify-center text-sm text-gray-500">
                Logo
              </div>
              <div className="-space-y-1 leading-none">
                <p className="text-4xl font-semibold tracking-tight text-[rgba(214,92,75,1)]">
                  Scheduling
                </p>
                <p className="text-4xl font-semibold tracking-tight text-[rgba(214,92,75,1)]">
                  of Care
                </p>
              </div>
            </div>

            {/* Welcome text */}
            <h1 className="text-5xl font-extrabold tracking-tight mb-6">Welcome!</h1>
            <p className="max-w-xl text-lg leading-7">
              Our platform helps streamline care management by connecting parents/power of attorney, carers, clients, and management in one place. 
              Easily schedule, manage, and track care activities with clarity and confidence.
            </p>
          </section>

          {/* Right section: login options */}
          <section className="bg-[#F7ECD9] p-8 sm:p-12 flex items-center justify-center">
            <div className="w-full max-w-md text-center">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                Login
              </h2>
              <p className="text-xl mb-8">Select your role</p>

              <div className="space-y-5">
                <Link
                  href="/login/carer"
                  className="block w-full rounded-full px-8 py-4 text-lg font-semibold shadow-sm hover:shadow-md transition
                             bg-[#4A0A0A] text-white hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#4A0A0A]/30"
                >
                  Carer
                </Link>
                <Link
                  href="/login/management"
                  className="block w-full rounded-full px-8 py-4 text-lg font-semibold shadow-sm hover:shadow-md transition
                             bg-[#4A0A0A] text-white hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#4A0A0A]/30"
                >
                  Management
                </Link>
                <Link
                  href="/login/family"
                  className="block w-full rounded-full px-8 py-4 text-lg font-semibold shadow-sm hover:shadow-md transition
                             bg-[#4A0A0A] text-white hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#4A0A0A]/30"
                >
                  Family/Power of Attorney
                </Link>
              </div>

              <p className="mt-10 text-lg">
                Don’t have an account?{" "}
                <Link
                  href="/signup"
                  className="underline underline-offset-4 font-semibold hover:opacity-80"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Floating help button */}
      <Link
        href="/help"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full
                   bg-[#E37E72] text-white text-2xl font-bold shadow-lg hover:shadow-xl transition
                   focus:outline-none focus:ring-4 focus:ring-[#E37E72]/40"
      >
        ?
      </Link>
    </div>
  );
}
