"use client";

const officialCallUrlRequiredMessage =
  "Please provide the exact official call or application URL.";

export function OfficialCallUrlInput({
  defaultValue,
  className,
}: {
  defaultValue: string;
  className: string;
}) {
  return (
    <input
      name="url"
      type="url"
      required
      defaultValue={defaultValue}
      className={className}
      onInvalid={(event) => {
        const input = event.currentTarget;

        if (!input.value.trim()) {
          input.setCustomValidity(officialCallUrlRequiredMessage);
        }
      }}
      onInput={(event) => {
        event.currentTarget.setCustomValidity("");
      }}
    />
  );
}
