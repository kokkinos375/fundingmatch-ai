import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const [{ message }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);

  if (user) {
    redirect("/projects");
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
        Create an account
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Keep project profiles, manual funding calls, and saved funding scans
        private to your account.
      </p>

      {message ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          {message}
        </div>
      ) : null}

      <form
        action={signupAction}
        className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <AuthField label="Email" name="email" type="email" />
        <AuthField label="Password" name="password" type="password" />
        <button
          type="submit"
          className="primary-action w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Sign up
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-teal-700">
          Log in
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
        minLength={type === "password" ? 6 : undefined}
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}
