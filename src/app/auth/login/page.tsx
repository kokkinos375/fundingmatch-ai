import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/auth/actions";
import { getCurrentUser, sanitizeNextPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const [{ message, next }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);
  const nextPath = sanitizeNextPath(next ?? null);

  if (user) {
    redirect(nextPath);
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-5 py-14">
      <Link
        href="/"
        className="text-sm font-semibold text-slate-500 hover:text-slate-950"
      >
        FundingMatch AI
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        Log in
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Access your private project profiles, curated funding calls, and saved
        scan reports.
      </p>

      {message ? <AuthMessage message={message} /> : null}

      <form
        action={loginAction}
        className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="next" value={nextPath} />
        <AuthField label="Email" name="email" type="email" />
        <AuthField label="Password" name="password" type="password" />
        <button
          type="submit"
          className="primary-action w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Log in
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        No account yet?{" "}
        <Link href="/auth/signup" className="font-semibold text-teal-700">
          Sign up
        </Link>
      </p>
    </section>
  );
}

function AuthField({
  label,
  name,
  type,
}: {
  label: string;
  name: string;
  type: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-800">
      {label}
      <input
        name={name}
        type={type}
        required
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function AuthMessage({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      {message}
    </div>
  );
}
