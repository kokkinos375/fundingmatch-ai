import { z } from "zod";
import { getPublicDemoProjectProfile } from "@/lib/public-demo";
import {
  fundingCallSchema,
  projectProfileSchema,
  type FundingCall,
  type ProjectProfile,
} from "@/lib/schemas";
import { getStorage, getStorageDiagnostics } from "@/lib/storage";

const manualFundingCallPortableSchema = fundingCallSchema
  .extend({
    sourceType: z.literal("manual").optional(),
  })
  .transform((call) => {
    return {
      ...call,
      sourceType: "manual",
    } satisfies FundingCall;
  });

export type PortableAppData = {
  exportedAt: string;
  projects: ProjectProfile[];
  manualFundingCalls: FundingCall[];
};

type ImportCollection = "projects" | "manualFundingCalls";

export type PortableImportValidationError = {
  collection: ImportCollection | "payload";
  index: number | null;
  id?: string;
  title?: string;
  messages: string[];
};

type ImportCounts = {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
};

export type PortableImportResult = {
  counts: {
    projects: ImportCounts;
    manualFundingCalls: ImportCounts;
  };
  validationErrors: PortableImportValidationError[];
};

export async function exportPortableAppData(): Promise<PortableAppData> {
  const storage = getStorage();
  const [projects, manualFundingCalls] = await Promise.all([
    storage.listProjects(),
    storage.listManualFundingCalls(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    projects,
    manualFundingCalls,
  };
}

export async function importPortableAppData(
  payload: unknown,
): Promise<PortableImportResult> {
  const storage = getStorage();
  const result = createEmptyImportResult();

  if (!isRecord(payload)) {
    result.validationErrors.push({
      collection: "payload",
      index: null,
      messages: ["Import payload must be a JSON object."],
    });
    result.counts.projects.errors += 1;
    result.counts.manualFundingCalls.errors += 1;

    return result;
  }

  const projectItems = readImportArray(payload, "projects", result);
  const manualFundingCallItems = readImportArray(
    payload,
    "manualFundingCalls",
    result,
  );
  const seenProjectIds = new Set<string>();
  const seenManualFundingCallIds = new Set<string>();

  for (const [index, item] of projectItems.entries()) {
    const project = projectProfileSchema.safeParse(item);

    if (!project.success) {
      addValidationError(result, "projects", index, item, project.error);
      continue;
    }

    if (seenProjectIds.has(project.data.id)) {
      result.counts.projects.skipped += 1;
      result.validationErrors.push({
        collection: "projects",
        index,
        id: project.data.id,
        title: project.data.name,
        messages: [`Duplicate project id "${project.data.id}" in payload.`],
      });
      continue;
    }

    seenProjectIds.add(project.data.id);

    try {
      const upsert = await storage.upsertProject(project.data);
      result.counts.projects[upsert.action] += 1;
    } catch (error) {
      result.counts.projects.errors += 1;
      result.validationErrors.push({
        collection: "projects",
        index,
        id: project.data.id,
        title: project.data.name,
        messages: [sanitizeImportError(error)],
      });
    }
  }

  for (const [index, item] of manualFundingCallItems.entries()) {
    const call = manualFundingCallPortableSchema.safeParse(item);

    if (!call.success) {
      addValidationError(result, "manualFundingCalls", index, item, call.error);
      continue;
    }

    if (seenManualFundingCallIds.has(call.data.id)) {
      result.counts.manualFundingCalls.skipped += 1;
      result.validationErrors.push({
        collection: "manualFundingCalls",
        index,
        id: call.data.id,
        title: call.data.title,
        messages: [`Duplicate manual funding call id "${call.data.id}" in payload.`],
      });
      continue;
    }

    seenManualFundingCallIds.add(call.data.id);

    try {
      const upsert = await storage.upsertManualFundingCall(call.data);
      result.counts.manualFundingCalls[upsert.action] += 1;
    } catch (error) {
      result.counts.manualFundingCalls.errors += 1;
      result.validationErrors.push({
        collection: "manualFundingCalls",
        index,
        id: call.data.id,
        title: call.data.title,
        messages: [sanitizeImportError(error)],
      });
    }
  }

  return result;
}

export async function seedExampleProject() {
  const storage = getStorage();
  const exampleProject = getPublicDemoProjectProfile();

  if (!exampleProject) {
    throw new Error("Public demo project is not available to seed.");
  }

  const existingProject = await storage.getProject(exampleProject.id);

  if (existingProject) {
    return {
      created: [],
      skipped: [
        {
          id: exampleProject.id,
          reason: "Project already exists.",
        },
      ],
    };
  }

  const upsert = await storage.upsertProject(exampleProject);

  return {
    created: [
      {
        id: upsert.record.id,
        name: upsert.record.name,
      },
    ],
    skipped: [],
  };
}

export async function cleanupVerificationRecords() {
  const storage = getStorage();
  const [projects, manualFundingCalls] = await Promise.all([
    storage.listProjects(),
    storage.listManualFundingCalls(),
  ]);
  const verificationProjects = projects.filter((project) => {
    return project.id.startsWith("supabase-verification-project");
  });
  const verificationCalls = manualFundingCalls.filter((call) => {
    return call.id.startsWith("verify-supabase");
  });
  const deletedProjects: Array<{ id: string; name: string }> = [];
  const deletedManualFundingCalls: Array<{ id: string; title: string }> = [];

  for (const project of verificationProjects) {
    await storage.deleteProject(project.id);
    deletedProjects.push({
      id: project.id,
      name: project.name,
    });
  }

  for (const call of verificationCalls) {
    await storage.deleteManualFundingCall(call.id);
    deletedManualFundingCalls.push({
      id: call.id,
      title: call.title,
    });
  }

  return {
    deleted: {
      projects: deletedProjects,
      manualFundingCalls: deletedManualFundingCalls,
    },
    skipped: {
      nonVerificationProjectCount: projects.length - verificationProjects.length,
      nonVerificationManualFundingCallCount:
        manualFundingCalls.length - verificationCalls.length,
    },
  };
}

export async function getStorageHealth() {
  const diagnostics = await getStorageDiagnostics();
  const storage = getStorage();
  let canListProjects = false;
  let canListManualFundingCalls = false;
  let projectCount: number | null = null;
  let manualFundingCallCount: number | null = null;
  const errors: string[] = [];

  try {
    const projects = await storage.listProjects();
    canListProjects = true;
    projectCount = projects.length;
  } catch (error) {
    errors.push(`Projects: ${sanitizeImportError(error)}`);
  }

  try {
    const manualFundingCalls = await storage.listManualFundingCalls();
    canListManualFundingCalls = true;
    manualFundingCallCount = manualFundingCalls.length;
  } catch (error) {
    errors.push(`Manual funding calls: ${sanitizeImportError(error)}`);
  }

  return {
    activeStorageDriver: diagnostics.activeDriver,
    supabaseSelected: diagnostics.supabase.selected,
    supabaseUrlPresent: diagnostics.supabase.hasUrl,
    supabaseServiceRoleKeyPresent: diagnostics.supabase.hasServiceRoleKey,
    supabaseReady: diagnostics.supabase.ready,
    canListProjects,
    canListManualFundingCalls,
    projectCount,
    manualFundingCallCount,
    error:
      errors.length > 0
        ? errors.join(" ")
        : diagnostics.supabase.error ?? undefined,
  };
}

function createEmptyImportResult(): PortableImportResult {
  return {
    counts: {
      projects: {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      },
      manualFundingCalls: {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      },
    },
    validationErrors: [],
  };
}

function readImportArray(
  payload: Record<string, unknown>,
  collection: ImportCollection,
  result: PortableImportResult,
) {
  const value = payload[collection];

  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  result.counts[collection].errors += 1;
  result.validationErrors.push({
    collection,
    index: null,
    messages: [`"${collection}" must be a JSON array when provided.`],
  });

  return [];
}

function addValidationError(
  result: PortableImportResult,
  collection: ImportCollection,
  index: number,
  candidate: unknown,
  error: z.ZodError,
) {
  result.counts[collection].errors += 1;
  result.validationErrors.push({
    collection,
    index,
    id: isRecord(candidate) ? getOptionalString(candidate.id) : undefined,
    title: isRecord(candidate)
      ? getOptionalString(candidate.title) ?? getOptionalString(candidate.name)
      : undefined,
    messages: error.issues.map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "record";

      return `${field}: ${issue.message}`;
    }),
  });
}

function sanitizeImportError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Storage operation failed.";
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
