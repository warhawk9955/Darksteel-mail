import Link from "next/link";
import WizardStepper from "../_components/WizardStepper";
import { nextStep, prevStep } from "../_lib/steps";

export const dynamic = "force-dynamic";

export default function DomainStepPage() {
  const back = prevStep("domain");
  const next = nextStep("domain");
  return (
    <>
      <WizardStepper current="domain" />
      <div className="max-w-[800px] mx-auto px-6 py-10">
        <h1 className="font-display text-3xl sm:text-4xl tracking-[0.04em] mb-3">
          Point your domain
        </h1>
        <p className="font-body text-text-dim mb-10 max-w-2xl leading-relaxed">
          You connect an existing domain — buying a new one inline isn&rsquo;t
          part of v1. Two minutes of DNS work and you&rsquo;re live.
        </p>

        <Step
          n={1}
          title="Get the deployment URL"
          body={
            <>
              After deploying to Vercel you&rsquo;ll get a default URL like{" "}
              <code className="font-mono text-blue">your-site.vercel.app</code>.
              That&rsquo;s your origin — point your domain at it.
            </>
          }
        />
        <Step
          n={2}
          title="Add an environment variable"
          body={
            <>
              Set <code className="font-mono text-blue">NEXT_PUBLIC_SITE_URL</code>{" "}
              in Vercel to your final domain (e.g.{" "}
              <code className="font-mono text-blue">https://darksteelmail.com</code>).
              Stripe success/cancel URLs and metadata use this value, so it has
              to match the live origin.
            </>
          }
        />
        <Step
          n={3}
          title="Add the domain in Vercel"
          body={
            <>
              In Vercel → Project → Settings → Domains, add your apex domain and
              the <code className="font-mono text-blue">www</code> subdomain.
              Vercel prints the exact A / CNAME records to add at your registrar.
            </>
          }
        />
        <Step
          n={4}
          title="Update Stripe webhook + Supabase Auth"
          body={
            <>
              Update the Stripe webhook endpoint to{" "}
              <code className="font-mono text-blue">https://&lt;your-domain&gt;/api/webhooks/stripe</code>{" "}
              and copy the new signing secret into{" "}
              <code className="font-mono text-blue">STRIPE_WEBHOOK_SECRET_LIVE</code>.
              In Supabase → Auth → URL Configuration, add{" "}
              <code className="font-mono text-blue">https://&lt;your-domain&gt;/auth/callback</code>{" "}
              to the allowed redirects so magic-link login works on the new origin.
            </>
          }
        />

        <div className="bg-panel border border-border p-5 mt-8">
          <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-2">
            Already own a domain?
          </div>
          <p className="font-body text-sm text-text-dim leading-relaxed">
            That&rsquo;s the supported path. There&rsquo;s no domain provisioning
            step — buying a new one inline isn&rsquo;t in v1.
          </p>
        </div>

        <div className="flex items-center justify-between mt-12">
          {back ? (
            <Link
              href={back}
              className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-white transition inline-flex items-center gap-2"
            >
              <span aria-hidden>←</span> Back
            </Link>
          ) : <span />}
          <Link
            href={next ?? "/admin"}
            className="bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-7 py-3 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200"
          >
            Continue →
          </Link>
        </div>
      </div>
    </>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <div className="border-l-2 border-blue pl-5 mb-6">
      <div className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-blue mb-1">
        Step {n}
      </div>
      <h3 className="font-display text-lg tracking-[0.04em] mb-2">{title}</h3>
      <p className="font-body text-sm text-text-dim leading-relaxed">{body}</p>
    </div>
  );
}
