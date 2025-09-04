import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen w-full bg-[#F3E9D9] text-zinc-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full">
        
        {/* Left section */}
        <section className="bg-[#F3C8A5] relative flex flex-col h-full">
          {/* Logo pinned top-left */}
            <div className="absolute top-8 left-8 flex items-center gap-4">
            <Image
                src="/logo.png"   // logo image
                alt="App Logo"
                width={64}
                height={64}
                className="rounded-md"
                priority
            />
            <p className="text-4xl font-semibold tracking-tight text-[rgba(214,92,75,1)]">
                Scheduling of Care
            </p>
            </div>

          {/* Welcome block */}
          <div className="flex flex-col justify-center items-start h-full pl-28 pr-10">
            <h1 className="text-7xl font-extrabold tracking-tight mb-8">
              Welcome!
            </h1>
            <p className="max-w-[38rem] text-2xl leading-9">
              Our platform helps streamline care management by connecting parents/power of attorney, carers, clients, and management in one place. 
              Easily schedule, manage, and track care activities with clarity and confidence.
            </p>
          </div>
        </section>

        {/* right login section */}
        <section className="bg-[#F7ECD9] p-12 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <h2 className="text-6xl font-extrabold tracking-tight mb-8">
              Login
            </h2>
            <p className="text-2xl mb-10">Select your role</p>

            <div className="space-y-6">
              <Link
                href="/login/carer"
                className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
              >
                Carer
              </Link>
              <Link
                href="/login/management"
                className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
              >
                Management
              </Link>
              <Link
                href="/login/family"
                className="block w-full rounded-full px-10 py-5 text-2xl font-semibold bg-[#4A0A0A] text-white hover:opacity-95 transition text-center"
              >
                Family/Power of Attorney
              </Link>
            </div>

            <p className="mt-12 text-xl">
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

