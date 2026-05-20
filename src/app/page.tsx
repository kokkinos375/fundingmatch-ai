import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/badge";
import {
  getPublicDemoProjectId,
  getPublicDemoProjectProfile,
} from "@/lib/public-demo";
import { getStorage } from "@/lib/storage";

export default async function HomePage() {
  const demoProjectId = getPublicDemoProjectId();
  const demoProject =
    (await getStorage().getProject(demoProjectId)) ?? getPublicDemoProjectProfile();

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Image
            src="/brand/fundingmatch-ai-logo.png"
            alt="FundingMatch AI logo"
            width={981}
            height={541}
            priority
            className="mb-8 h-auto w-52 sm:w-64"
          />
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Match startup and project profiles to EU funding calls.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            FundingMatch AI helps teams compare project profiles with funding
            opportunities and review fit, risks, missing information, and next
            steps.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/projects/${demoProjectId}/scan`}
              className="primary-action inline-flex justify-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Scan demo project
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Create project
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Funding scan preview
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Ranked opportunities and practical fit notes
              </p>
            </div>
            <Badge tone="teal">MVP</Badge>
          </div>
          <div className="mt-5 space-y-4">
            {demoProject ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">Example profile</Badge>
                  <Badge>{demoProject.country}</Badge>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-950">
                  {demoProject.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {demoProject.shortDescription}
                </p>
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Call</th>
                    <th className="px-4 py-3 font-semibold">Score</th>
                    <th className="px-4 py-3 font-semibold">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="px-4 py-3 text-slate-700">
                      AI and Data Spaces for Climate-Resilient Ocean Operations
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      86
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="green">Excellent</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">
                      AI Testing and Experimentation Voucher Scheme
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      74
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="teal">Good</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
