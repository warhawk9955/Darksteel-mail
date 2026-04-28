import LoginForm from "./LoginForm";

interface PageProps {
  searchParams: Promise<{ next?: string; sent?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next, sent } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-6 h-6 bg-gradient-to-br from-blue to-red rotate-45 relative">
            <div className="absolute inset-[3px] bg-bg" />
          </div>
          <span className="font-display text-2xl tracking-[0.1em]">
            Darksteel Mail
          </span>
        </div>

        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
          Operator sign-in
        </div>
        <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] leading-[1] mb-3">
          Magic link login.
        </h1>
        <p className="font-body text-text-dim mb-8">
          Enter the operator email. We&rsquo;ll send a one-time link.
        </p>

        <LoginForm nextPath={next} alreadySent={sent === "1"} />
      </div>
    </main>
  );
}
