import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Layers3,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { Wordmark } from "@/components/brand";
import { ProductPreview } from "@/components/workspace/product-preview";

export default function Home() {
  return (
    <main className="landing" id="main-content">
      <header className="landing-nav">
        <Wordmark />
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-3 sm:gap-7"
        >
          <a
            href="#how-it-works"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
          >
            How it works
          </a>
          <Link href="/login" className="text-sm font-medium">
            Sign in
          </Link>
          <Link href="/signup" className="button-primary">
            Start building <ArrowUpRight className="size-4" />
          </Link>
        </nav>
      </header>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            The ground beneath your next big idea.
          </p>
          <h1>
            Know what you
            <br className="hidden sm:block" /> can build.
            <br />
            <span className="text-primary">
              Know what to
              <br className="hidden sm:block" /> do next.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            A property. An idea. A clear path forward. Bouldrr brings your land,
            local rules, and development plan into one thoughtful workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href="/signup" className="button-primary py-3.5">
              Find your starting point <ArrowRight className="size-4" />
            </Link>
            <a
              href="#workspace"
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              Explore the workspace <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" />
              No AI key needed
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" />
              Your projects, privately stored
            </span>
          </div>
        </div>
        <div className="hero-visual" id="workspace">
          <div className="hero-coordinate">LAND / VISION / POSSIBILITY</div>
          <ProductPreview />
          <p className="mt-3 text-right font-mono text-[10px] text-muted-foreground">
            A designed preview. No real parcel or zoning data shown.
          </p>
        </div>
      </section>
      <div className="landing-strip">
        <span>Built for the whole journey.</span>
        <p>
          Find <i /> Understand <i /> Plan <i /> Permit <i /> Build <i /> Beyond
        </p>
      </div>
      <section id="how-it-works" className="landing-section">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Less guesswork. More groundwork.</p>
            <h2 className="mt-4 max-w-xl text-3xl font-medium leading-tight tracking-[-.045em] sm:text-5xl">
              Big ideas need
              <br />a solid place to start.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Move from “what if?” to “what’s next?” with the property, context,
            and practical steps together.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            [
              Compass,
              "01 / Understand the property",
              "Start with a real address.",
              "Locate a property, save the details, and see what you know—and what still needs checking.",
            ],
            [
              Layers3,
              "02 / Explore the possibilities",
              "Give your idea some shape.",
              "Sketch buildings, parking, and access on your map. Save and refine a conceptual site plan.",
            ],
            [
              ListChecks,
              "03 / Move the project forward",
              "Always have a next step.",
              "Work through due diligence, permits, and construction with dependencies, documents, and progress.",
            ],
          ].map(([Icon, kicker, title, body]) => {
            const Component = Icon as typeof Compass;
            return (
              <article className="landing-feature" key={String(kicker)}>
                <Component className="mb-8 size-7 stroke-[1.3] text-primary" />
                <p className="eyebrow">{String(kicker)}</p>
                <h3 className="mt-4 text-xl font-medium tracking-tight">
                  {String(title)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {String(body)}
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="trust-section">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
          <div className="trust-paper">
            <div className="flex items-center gap-2 border-b pb-4 text-xs font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Clarity starts with the source.
            </div>
            <div className="space-y-5 py-5">
              {[
                [
                  "Official Source",
                  "The original rule and responsible agency.",
                ],
                [
                  "Bouldrr Derived",
                  "A plain-language explanation, clearly separated.",
                ],
                ["Unknown", "An open question, with a useful next step."],
              ].map(([t, d]) => (
                <div key={t}>
                  <span className="source-badge">{t}</span>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
            <p className="border-t pt-4 text-xs text-muted-foreground">
              Local source coverage varies. Unconnected data stays unknown.
            </p>
          </div>
          <div>
            <p className="eyebrow">Grounded in facts, honest about gaps.</p>
            <h2 className="mt-4 text-3xl font-medium tracking-[-.045em] sm:text-4xl">
              Your decisions deserve
              <br />
              more than a guess.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
              Track local regulations with their agency, official link, and
              review status. Keep your own notes and Bouldrr summaries distinct.
              No invented zoning. No imaginary parcel boundaries.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary"
              href="/signup"
            >
              Build with more clarity <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
      <section className="landing-section text-center">
        <p className="eyebrow">Start with a possibility.</p>
        <h2 className="mt-5 text-4xl font-medium tracking-[-.05em] sm:text-5xl">
          What will you build?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          From your first renovation to your next development.
          <br />
          Put your property and your plan in one place.
        </p>
        <Link href="/signup" className="button-primary mt-7">
          Create your workspace <ArrowUpRight className="size-4" />
        </Link>
      </section>
      <footer className="landing-nav border-t">
        <Wordmark />
        <p className="text-xs text-muted-foreground">
          A little land. A lot of possibility.
        </p>
        <Link
          href="/login"
          className="hidden text-xs text-muted-foreground sm:block"
        >
          Your workspace <ArrowUpRight className="inline size-3" />
        </Link>
      </footer>
    </main>
  );
}
