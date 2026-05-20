"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getStorageForUser } from "@/lib/storage";
import { type FundingCallInput } from "@/lib/storage/types";

export async function createManualFundingCallAction(formData: FormData) {
  const user = await requireUser("/funding-calls/new");
  const call = await getStorageForUser(user.id).createManualFundingCall(
    readManualFundingCallForm(formData),
  );

  revalidatePath("/funding-calls");
  redirect(`/funding-calls/${call.id}`);
}

export async function updateManualFundingCallAction(
  id: string,
  formData: FormData,
) {
  const user = await requireUser(`/funding-calls/${id}/edit`);
  const call = await getStorageForUser(user.id).updateManualFundingCall(
    id,
    readManualFundingCallForm(formData),
  );

  revalidatePath("/funding-calls");
  revalidatePath(`/funding-calls/${id}`);
  redirect(`/funding-calls/${call.id}`);
}

export async function deleteManualFundingCallAction(id: string) {
  const user = await requireUser(`/funding-calls/${id}`);

  await getStorageForUser(user.id).deleteManualFundingCall(id);

  revalidatePath("/funding-calls");
  redirect("/funding-calls");
}

function readManualFundingCallForm(
  formData: FormData,
): FundingCallInput {
  return {
    title: getText(formData, "title"),
    programme: getText(formData, "programme"),
    topicId: getText(formData, "topicId"),
    status: getText(formData, "status"),
    deadline: getText(formData, "deadline"),
    budget: getText(formData, "budget"),
    url: getText(formData, "url"),
    description: getText(formData, "description"),
    eligibility: getText(formData, "eligibility"),
    sourceName: getText(formData, "sourceName"),
    sourceUrl: getText(formData, "sourceUrl"),
  };
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
