import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { mockProjectProfiles } from "@/lib/mock-data";
import {
  createProjectProfileSchema,
  fundingCallSchema,
  projectProfileSchema,
  type FundingCall,
  type ProjectProfile,
} from "@/lib/schemas";
import {
  fundingCallInputSchema,
  MANUAL_FUNDING_SOURCE_NAME,
  type AppStorage,
  type FundingCallInput,
  type ProjectProfileInput,
  type StorageValidationError,
} from "@/lib/storage/types";

const projectsFilePath = path.join(process.cwd(), "src", "data", "projects.json");
const manualFundingCallsFilePath = path.join(
  process.cwd(),
  "src",
  "data",
  "manual-funding-calls.json",
);

type ReadResult<T> = {
  records: T[];
  validationErrors: StorageValidationError[];
};

export class LocalJsonStorage implements AppStorage {
  async listProjects() {
    const result = readProjectsFile();

    return result.records.toSorted((first, second) => {
      return second.updatedAt.localeCompare(first.updatedAt);
    });
  }

  async getProject(id: string) {
    const projects = await this.listProjects();

    return projects.find((project) => project.id === id) ?? null;
  }

  async createProject(input: ProjectProfileInput) {
    const parsedInput = createProjectProfileSchema.parse(input);
    const projects = readProjectsFile().records;
    const now = new Date().toISOString();
    const project = projectProfileSchema.parse({
      ...parsedInput,
      id: createUniqueId(parsedInput.name, new Set(projects.map((item) => item.id))),
      createdAt: now,
      updatedAt: now,
    });

    writeProjectsFile([project, ...projects]);

    return project;
  }

  async updateProject(id: string, input: ProjectProfileInput) {
    const parsedInput = createProjectProfileSchema.parse(input);
    const projects = readProjectsFile().records;
    const existingProject = projects.find((project) => project.id === id);

    if (!existingProject) {
      throw new Error(`Project profile "${id}" was not found.`);
    }

    const updatedProject = projectProfileSchema.parse({
      ...parsedInput,
      id,
      createdAt: existingProject.createdAt,
      updatedAt: new Date().toISOString(),
    });

    writeProjectsFile(
      projects.map((project) => {
        return project.id === id ? updatedProject : project;
      }),
    );

    return updatedProject;
  }

  async deleteProject(id: string) {
    const projects = readProjectsFile().records;
    const nextProjects = projects.filter((project) => project.id !== id);

    writeProjectsFile(nextProjects);
  }

  async upsertProject(record: ProjectProfile) {
    const parsedRecord = projectProfileSchema.parse(record);
    const projects = readProjectsFile().records;
    const existingProject = projects.find(
      (project) => project.id === parsedRecord.id,
    );
    const nextProjects = existingProject
      ? projects.map((project) => {
          return project.id === parsedRecord.id ? parsedRecord : project;
        })
      : [parsedRecord, ...projects];

    writeProjectsFile(nextProjects);

    return {
      action: existingProject ? "updated" : "created",
      record: parsedRecord,
    } as const;
  }

  async listManualFundingCalls() {
    return readManualFundingCallsFile().records;
  }

  async getManualFundingCall(id: string) {
    const calls = await this.listManualFundingCalls();

    return calls.find((call) => call.id === id) ?? null;
  }

  async createManualFundingCall(input: FundingCallInput) {
    const calls = readManualFundingCallsFile().records;
    const existingIds = new Set(calls.map((call) => call.id));
    const call = parseManualFundingCallInput(input, {
      existingIds,
      retrievedAt: new Date().toISOString(),
    });

    writeManualFundingCallsFile([call, ...calls]);

    return call;
  }

  async updateManualFundingCall(id: string, input: FundingCallInput) {
    const calls = readManualFundingCallsFile().records;
    const existingCall = calls.find((call) => call.id === id);

    if (!existingCall) {
      throw new Error(`Manual funding call "${id}" was not found.`);
    }

    const updatedCall = parseManualFundingCallInput(input, {
      existingIds: new Set(),
      forceId: id,
      retrievedAt: existingCall.retrievedAt ?? new Date().toISOString(),
    });

    writeManualFundingCallsFile(
      calls.map((call) => {
        return call.id === id ? updatedCall : call;
      }),
    );

    return updatedCall;
  }

  async deleteManualFundingCall(id: string) {
    const calls = readManualFundingCallsFile().records;
    const nextCalls = calls.filter((call) => call.id !== id);

    writeManualFundingCallsFile(nextCalls);
  }

  async upsertManualFundingCall(record: FundingCall) {
    const parsedRecord = fundingCallSchema.parse({
      ...record,
      sourceType: "manual",
    });
    const calls = readManualFundingCallsFile().records;
    const existingCall = calls.find((call) => call.id === parsedRecord.id);
    const nextCalls = existingCall
      ? calls.map((call) => {
          return call.id === parsedRecord.id ? parsedRecord : call;
        })
      : [parsedRecord, ...calls];

    writeManualFundingCallsFile(nextCalls);

    return {
      action: existingCall ? "updated" : "created",
      record: parsedRecord,
    } as const;
  }

  async getValidationDiagnostics() {
    const projects = readProjectsFile();
    const calls = readManualFundingCallsFile();

    return {
      projectsLoaded: projects.records.length,
      manualFundingCallsLoaded: calls.records.length,
      validationErrors: [
        ...projects.validationErrors,
        ...calls.validationErrors,
      ],
    };
  }
}

function readProjectsFile(): ReadResult<ProjectProfile> {
  return readValidatedArrayFile({
    filePath: projectsFilePath,
    collection: "projects",
    schema: projectProfileSchema,
    defaultRecords: mockProjectProfiles,
  });
}

function readManualFundingCallsFile(): ReadResult<FundingCall> {
  return readValidatedArrayFile({
    filePath: manualFundingCallsFilePath,
    collection: "manualFundingCalls",
    schema: fundingCallSchema,
    defaultRecords: [],
  });
}

function readValidatedArrayFile<T>({
  filePath,
  collection,
  schema,
  defaultRecords,
}: {
  filePath: string;
  collection: StorageValidationError["collection"];
  schema: z.ZodType<T>;
  defaultRecords: T[];
}): ReadResult<T> {
  ensureJsonArrayFile(filePath, defaultRecords);

  try {
    const content = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed)) {
      const validationError: StorageValidationError = {
        collection,
        index: null,
        messages: [`${path.basename(filePath)} must contain a JSON array.`],
      };
      logStorageWarning("Storage file is invalid", validationError);

      return { records: [], validationErrors: [validationError] };
    }

    const records: T[] = [];
    const validationErrors: StorageValidationError[] = [];

    parsed.forEach((item, index) => {
      const result = schema.safeParse(item);

      if (result.success) {
        records.push(result.data);
        return;
      }

      const validationError = buildValidationError(collection, index, item, result.error);
      validationErrors.push(validationError);
      logStorageWarning("Invalid storage record skipped", validationError);
    });

    return { records, validationErrors };
  } catch (error) {
    const validationError: StorageValidationError = {
      collection,
      index: null,
      messages: [
        error instanceof Error
          ? `${path.basename(filePath)} could not be parsed: ${error.message}`
          : `${path.basename(filePath)} could not be parsed.`,
      ],
    };
    logStorageWarning("Storage file parse failed", validationError);

    return { records: [], validationErrors: [validationError] };
  }
}

function parseManualFundingCallInput(
  input: FundingCallInput,
  options: {
    existingIds: Set<string>;
    retrievedAt: string;
    forceId?: string;
  },
) {
  const parsedInput = fundingCallInputSchema.parse(input);
  const id =
    options.forceId ??
    createUniqueId(
      parsedInput.topicId || parsedInput.title,
      options.existingIds,
    );

  return fundingCallSchema.parse({
    ...parsedInput,
    id,
    sourceName: parsedInput.sourceName || MANUAL_FUNDING_SOURCE_NAME,
    sourceType: "manual",
    sourceUrl: parsedInput.sourceUrl ?? parsedInput.url,
    retrievedAt: options.retrievedAt,
  });
}

function writeProjectsFile(projects: ProjectProfile[]) {
  writeJsonArrayFile(projectsFilePath, projects);
}

function writeManualFundingCallsFile(calls: FundingCall[]) {
  writeJsonArrayFile(manualFundingCallsFilePath, calls);
}

function ensureJsonArrayFile<T>(filePath: string, defaultRecords: T[]) {
  const directory = path.dirname(filePath);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  if (!existsSync(filePath)) {
    writeJsonArrayFile(filePath, defaultRecords);
  }
}

function writeJsonArrayFile<T>(filePath: string, records: T[]) {
  writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`);
}

function buildValidationError(
  collection: StorageValidationError["collection"],
  index: number,
  candidate: unknown,
  error: z.ZodError,
): StorageValidationError {
  return {
    collection,
    index,
    id: isRecord(candidate) ? getOptionalString(candidate.id) : undefined,
    title: isRecord(candidate) ? getOptionalString(candidate.title) : undefined,
    messages: error.issues.map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "record";

      return `${field}: ${issue.message}`;
    }),
  };
}

function createUniqueId(seed: string, existingIds: Set<string>) {
  const baseId = slugify(seed) || `record-${Date.now().toString(36)}`;
  let candidate = baseId;
  let counter = 2;

  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${counter}`;
    counter += 1;
  }

  existingIds.add(candidate);

  return candidate;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
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

function logStorageWarning(message: string, metadata: StorageValidationError) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[local-json-storage] ${message}`, metadata);
}
