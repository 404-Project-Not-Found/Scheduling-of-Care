// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen w-full bg-[#F3E9D9] text-zinc-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full">
        
        {/* Left section */}
        <section className="bg-[#F3C8A5] relative flex flex-col h-full">
            <div className="flex flex-col items-start h-full pl-10 lg:pl-28 pr-8 lg:pr-10 justify-start mt-40">
                {/* big logo with name */}
                <Image
                src="/logo-name.png"
                alt="App Logo"
                width={600}
                height={150}
                priority
                className="mb-10 -ml-16 lg:-ml-12"
                />

                <h1 className="text-7xl font-extrabold tracking-tight mb-8">
                Welcome!
                </h1>
                <p className="max-w-[42rem] text-2xl leading-9">
                Our platform helps streamline care management by connecting parents/power of attorney,
                carers, clients, and management in one place. Easily schedule, manage, and track care
                activities with clarity and confidence.
                </p>
            </div>
        </section>

        {/* Right: login form */}
        <section className="bg-[#F7ECD9] p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-5xl font-extrabold tracking-tight mb-10 text-center">
              User Login
            </h2>

            <form className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xl font-medium mb-2 text-left"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-[#4A0A0A] bg-white shadow-sm px-3 py-3 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/40"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xl font-medium mb-2 text-left"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-md border border-[#4A0A0A] bg-white shadow-sm px-3 py-3 text-lg outline-none focus:ring-2 focus:ring-[#4A0A0A]/40"
                />
              </div>

              {/* Stay signed in */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="staySignedIn"
                  className="h-5 w-5 rounded border border-black/40 accent-[#4A0A0A]"
                />
                <label htmlFor="staySignedIn" className="text-lg">
                  Stay signed in for 30 days
                </label>
              </div>

              {/* Login button */}
              <button
                type="submit"
                className="w-full rounded-full px-8 py-4 text-xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition"
              >
                Login
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <Link
                href="/forgot-password"
                className="text-lg underline underline-offset-4 hover:opacity-80"
              >
                Forgot Password?
              </Link>
            </div>
            <p className="mt-4 text-lg text-center">
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

      {/* Floating help button */}
      <Link
        href="/help"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full
                   bg-[#E37E72] text-white text-2xl font-bold shadow-lg hover:shadow-xl transition"
      >
        ?
      </Link>
    </div>
  );
}
