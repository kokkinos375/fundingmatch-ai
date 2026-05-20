import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <section className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
        Account
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Your project profiles, manual funding calls, and saved scans are scoped
        to this Supabase account.
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Signed in as
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-950">
          {user.email ?? user.id}
        </p>
        <form action={logoutAction} className="mt-5">
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </form>
      </div>
    </section>
  );
}
