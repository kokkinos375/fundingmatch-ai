"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStorage } from "@/lib/storage";
import { type FundingCallInput } from "@/lib/storage/types";

export async function createManualFundingCallAction(formData: FormData) {
  const call = await getStorage().createManualFundingCall(
    readManualFundingCallForm(formData),
  );

  revalidatePath("/funding-calls");
  redirect(`/funding-calls/${call.id}`);
}

export async function updateManualFundingCallAction(
  id: string,
  formData: FormData,
) {
  const call = await getStorage().updateManualFundingCall(
    id,
    readManualFundingCallForm(formData),
  );

  revalidatePath("/funding-calls");
  revalidatePath(`/funding-calls/${id}`);
  redirect(`/funding-calls/${call.id}`);
}

export async function deleteManualFundingCallAction(id: string) {
  await getStorage().deleteManualFundingCall(id);

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
