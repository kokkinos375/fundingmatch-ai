"use client";

export function ConfirmDeleteForm({
  action,
  label,
  message,
}: {
  action: () => Promise<void>;
  label: string;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex w-full justify-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
      >
        {label}
      </button>
    </form>
  );
}
