import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/badge";
import {
  getPublicDemoProjectId,
  getPublicDemoProjectProfile,
} from "@/lib/public-demo";
import { getStorage } from "@/lib/storage";

const howItWorks = [
  {
    title: "Describe your project",
    description:
      "Start with a plain-language idea, then turn it into a clear project profile.",
  },
  {
    title: "Generate a profile",
    description:
      "Review suggested sectors, technologies, users, keywords, and funding preferences.",
  },
  {
    title: "Scan funding calls",
    description:
      "Compare your profile against available opportunities and see the strongest matches first.",
  },
  {
    title: "Save results",
    description:
      "Keep scan snapshots so you can revisit promising opportunities later.",
  },
];

const benefits = [
  {
    title: "Save research time",
    description:
      "Move from scattered funding pages to a focused shortlist built around your project.",
  },
  {
    title: "Compare opportunities",
    description:
      "Review fit, risks, missing information, deadlines, budgets, and official links side by side.",
  },
  {
    title: "Keep saved searches private",
    description:
      "Signed-in users can store projects, curated calls, and saved scan reports in their own account.",
  },
];

export default async function HomePage() {
  const demoProjectId = getPublicDemoProjectId();
  const demoProject =
    (await getStorage().getProject(demoProjectId)) ?? getPublicDemoProjectProfile();

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <Image
            src="/brand/fundingmatch-ai-logo.png"
            alt="FundingMatch AI logo"
            width={1689}
            height={931}
            priority
            className="mb-9 h-auto w-52 sm:w-64"
          />
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Find EU funding opportunities that match your project
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Create a project profile, scan funding opportunities, compare the
            best matches, and save promising results for later review.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create account
            </Link>
            <Link
              href={`/projects/${demoProjectId}/scan`}
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Try demo scan
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                EcoSmart Demo preview
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Try a public example profile before creating your own account.
              </p>
            </div>
            <Badge tone="green">Public demo</Badge>
          </div>

          {demoProject ? (
            <div className="mt-5">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {demoProject.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {demoProject.shortDescription}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {demoProject.sectors.slice(0, 4).map((sector) => (
                  <Badge key={sector} tone="blue">
                    {sector}
                  </Badge>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <PreviewItem label="Stage" value={demoProject.stage} />
                <PreviewItem
                  label="Funding interests"
                  value={demoProject.preferredFundingTypes.join(", ")}
                />
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/projects/${demoProjectId}`}
                  className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View demo profile
                </Link>
                <Link
                  href={`/projects/${demoProjectId}/scan`}
                  className="inline-flex justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Try demo scan
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Go from an early idea to a practical funding shortlist in a few
              clear steps.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {howItWorks.map((item, index) => (
              <div
                key={item.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Built for faster funding decisions
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              FundingMatch AI helps founders, teams, and project leads stay
              organized while reviewing opportunities.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 text-white lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Start with a public demo or create your own private workspace
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Explore the EcoSmart Demo scan, then create an account when you
              are ready to save projects, curated calls, and funding matches.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/auth/signup"
              className="inline-flex justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-slate-100"
            >
              Create account
            </Link>
            <Link
              href={`/projects/${demoProjectId}/scan`}
              className="inline-flex justify-center rounded-md border border-slate-600 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Try demo scan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">
        {value.replace("_", " ")}
      </p>
    </div>
  );
}
