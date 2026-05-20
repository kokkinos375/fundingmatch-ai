"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  defaultScoringWeights,
  fundingTypeSchema,
  type CreateProjectProfile,
} from "@/lib/schemas";
import { getStorage } from "@/lib/storage";
import { projectProfileInputSchema } from "@/lib/storage/types";

export type ProjectFormState = {
  errors: string[];
};

const weightKeys = [
  "topicFit",
  "eligibilityFit",
  "fundingFit",
  "stageFit",
  "deadlineFit",
  "competitionRisk",
  "strategicValue",
] as const;

export async function createProjectAction(
  previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  void previousState;

  const input = readProjectInput(formData);
  const result = projectProfileInputSchema.safeParse(input);

  if (!result.success) {
    return { errors: formatZodErrors(result.error) };
  }

  const project = await getStorage().createProject(result.data);

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  id: string,
  previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  void previousState;

  const input = readProjectInput(formData);
  const result = projectProfileInputSchema.safeParse(input);

  if (!result.success) {
    return { errors: formatZodErrors(result.error) };
  }

  const project = await getStorage().updateProject(id, result.data);

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(id: string) {
  await getStorage().deleteProject(id);

  revalidatePath("/projects");
  redirect("/projects");
}

function readProjectInput(formData: FormData): CreateProjectProfile {
  const fundingTypes = formData
    .getAll("preferredFundingTypes")
    .flatMap((value) => {
      const result = fundingTypeSchema.safeParse(value);

      return result.success ? [result.data] : [];
    });
  const rawTrl = getText(formData, "trl");
  const trl = rawTrl ? Number(rawTrl) : undefined;

  return {
    name: getText(formData, "name"),
    shortDescription: getText(formData, "shortDescription"),
    country: getText(formData, "country"),
    sectors: parseList(getText(formData, "sectors")),
    technologies: parseList(getText(formData, "technologies")),
    targetUsers: getText(formData, "targetUsers"),
    problemSolved: getText(formData, "problemSolved"),
    solution: getText(formData, "solution"),
    stage: getText(formData, "stage") as CreateProjectProfile["stage"],
    trl: trl && Number.isFinite(trl) ? trl : undefined,
    preferredFundingTypes: fundingTypes,
    keywords: parseList(getText(formData, "keywords")),
    avoid: parseList(getText(formData, "avoid")),
    scoringWeights: Object.fromEntries(
      weightKeys.map((key) => {
        const rawValue = getText(formData, key);
        const fallback = defaultScoringWeights[key];
        const value = rawValue ? Number(rawValue) : fallback;

        return [key, Number.isFinite(value) ? value : fallback];
      }),
    ) as CreateProjectProfile["scoringWeights"],
  };
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join(".") : "form";

    return `${field}: ${issue.message}`;
  });
}
