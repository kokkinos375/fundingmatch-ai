import "server-only";

import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getPublicDemoProjectId } from "@/lib/public-demo";
import {
  fundingCallSchema,
  projectProfileSchema,
  savedScanSchema,
  type FundingCall,
  type ProjectProfile,
  type SavedScan,
} from "@/lib/schemas";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/storage/config";
import {
  fundingCallInputSchema,
  MANUAL_FUNDING_SOURCE_NAME,
  projectProfileInputSchema,
  type AppStorage,
  type FundingCallInput,
  type ProjectProfileInput,
  type SavedScanInput,
  type StorageValidationError,
} from "@/lib/storage/types";

type SupabaseStorageScope = {
  mode: "scoped" | "admin";
  userId: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  short_description: string;
  country: string | null;
  sectors: unknown;
  technologies: unknown;
  target_users: unknown;
  problem_solved: string | null;
  solution: string | null;
  stage: string;
  trl: number | null;
  preferred_funding_types: unknown;
  keywords: unknown;
  avoid: unknown;
  scoring_weights: unknown;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
};

type ManualFundingCallRow = {
  id: string;
  title: string;
  programme: string | null;
  topic_id: string | null;
  status: string | null;
  deadline: string | null;
  budget: string | null;
  url: string | null;
  description: string | null;
  eligibility: string | null;
  source_name: string | null;
  source_type: string | null;
  source_url: string | null;
  retrieved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
};

type SavedScanRow = {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string | null;
  result: unknown;
  created_at: string | null;
};

type ReadResult<T> = {
  records: T[];
  validationErrors: StorageValidationError[];
};

let supabaseClient: SupabaseClient | null = null;

export class SupabaseStorage implements AppStorage {
  constructor(
    private readonly scope: SupabaseStorageScope = {
      mode: "scoped",
      userId: null,
    },
  ) {}

  async listProjects(): Promise<ProjectProfile[]> {
    return (await this.readProjectRows()).records.toSorted((first, second) => {
      return second.updatedAt.localeCompare(first.updatedAt);
    });
  }

  async getProject(id: string): Promise<ProjectProfile | null> {
    if (!this.canReadProject(id)) {
      return null;
    }

    let query = getSupabaseClient()
      .from("projects")
      .select("*")
      .eq("id", id);

    if (!this.isAdmin() && !this.isPublicDemoProject(id)) {
      const userId = this.requireUserId("read projects");

      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.maybeSingle<ProjectRow>();

    if (error) {
      throw new Error(`Supabase project lookup failed: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const mappedProject = mapProjectRow(data);
    const result = projectProfileSchema.safeParse(mappedProject);

    if (result.success) {
      return result.data;
    }

    logSupabaseValidationWarning(
      "Invalid Supabase project row skipped",
      buildValidationError("projects", null, data, result.error),
    );

    return null;
  }

  async createProject(input: ProjectProfileInput): Promise<ProjectProfile> {
    const userId = this.requireUserId("create projects");
    const parsedInput = projectProfileInputSchema.parse(input);
    const now = new Date().toISOString();
    const id = await this.createUniqueId("projects", parsedInput.name);
    const row = projectInputToRow(parsedInput, {
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    });
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .insert(row)
      .select("*")
      .single<ProjectRow>();

    if (error) {
      throw new Error(`Supabase project create failed: ${error.message}`);
    }

    return parseProjectRowOrThrow(data);
  }

  async updateProject(
    id: string,
    input: ProjectProfileInput,
  ): Promise<ProjectProfile> {
    const userId = this.requireUserId("update projects");
    const existingProject = await this.getProject(id);

    if (!existingProject) {
      throw new Error(`Project profile "${id}" was not found.`);
    }

    const parsedInput = projectProfileInputSchema.parse(input);
    const row = projectInputToRow(parsedInput, {
      id,
      userId,
      createdAt: existingProject.createdAt,
      updatedAt: new Date().toISOString(),
    });
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .update(row)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single<ProjectRow>();

    if (error) {
      throw new Error(`Supabase project update failed: ${error.message}`);
    }

    return parseProjectRowOrThrow(data);
  }

  async deleteProject(id: string): Promise<void> {
    const userId = this.requireUserId("delete projects");
    const { error } = await getSupabaseClient()
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Supabase project delete failed: ${error.message}`);
    }
  }

  async upsertProject(record: ProjectProfile) {
    if (!this.isAdmin()) {
      throw new Error("Project import/upsert is available only to admin tools.");
    }

    const parsedRecord = projectProfileSchema.parse(record);
    const existingProject = await this.getProject(parsedRecord.id);
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .upsert(projectToRow(parsedRecord, null), { onConflict: "id" })
      .select("*")
      .single<ProjectRow>();

    if (error) {
      throw new Error(`Supabase project upsert failed: ${error.message}`);
    }

    return {
      action: existingProject ? "updated" : "created",
      record: parseProjectRowOrThrow(data),
    } as const;
  }

  async listManualFundingCalls(): Promise<FundingCall[]> {
    return (await this.readManualFundingCallRows()).records;
  }

  async getManualFundingCall(id: string): Promise<FundingCall | null> {
    if (!this.isAdmin() && !this.scope.userId) {
      return null;
    }

    let query = getSupabaseClient()
      .from("manual_funding_calls")
      .select("*")
      .eq("id", id);

    if (!this.isAdmin()) {
      query = query.eq("user_id", this.requireUserId("read manual calls"));
    }

    const { data, error } = await query.maybeSingle<ManualFundingCallRow>();

    if (error) {
      throw new Error(
        `Supabase manual funding call lookup failed: ${error.message}`,
      );
    }

    if (!data) {
      return null;
    }

    const mappedCall = mapManualFundingCallRow(data);
    const result = fundingCallSchema.safeParse(mappedCall);

    if (result.success) {
      return result.data;
    }

    logSupabaseValidationWarning(
      "Invalid Supabase manual funding call row skipped",
      buildValidationError("manualFundingCalls", null, data, result.error),
    );

    return null;
  }

  async createManualFundingCall(
    input: FundingCallInput,
  ): Promise<FundingCall> {
    const userId = this.requireUserId("create manual funding calls");
    const parsedInput = fundingCallInputSchema.parse(input);
    const now = new Date().toISOString();
    const id = await this.createUniqueId(
      "manual_funding_calls",
      parsedInput.topicId || parsedInput.title,
    );
    const row = fundingCallInputToRow(parsedInput, {
      id,
      userId,
      retrievedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const { data, error } = await getSupabaseClient()
      .from("manual_funding_calls")
      .insert(row)
      .select("*")
      .single<ManualFundingCallRow>();

    if (error) {
      throw new Error(
        `Supabase manual funding call create failed: ${error.message}`,
      );
    }

    return parseFundingCallRowOrThrow(data);
  }

  async updateManualFundingCall(
    id: string,
    input: FundingCallInput,
  ): Promise<FundingCall> {
    const userId = this.requireUserId("update manual funding calls");
    const existingCall = await this.getManualFundingCall(id);

    if (!existingCall) {
      throw new Error(`Manual funding call "${id}" was not found.`);
    }

    const parsedInput = fundingCallInputSchema.parse(input);
    const row = fundingCallInputToRow(parsedInput, {
      id,
      userId,
      retrievedAt: existingCall.retrievedAt ?? new Date().toISOString(),
      createdAt: null,
      updatedAt: new Date().toISOString(),
    });
    const { data, error } = await getSupabaseClient()
      .from("manual_funding_calls")
      .update(row)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single<ManualFundingCallRow>();

    if (error) {
      throw new Error(
        `Supabase manual funding call update failed: ${error.message}`,
      );
    }

    return parseFundingCallRowOrThrow(data);
  }

  async deleteManualFundingCall(id: string): Promise<void> {
    const userId = this.requireUserId("delete manual funding calls");
    const { error } = await getSupabaseClient()
      .from("manual_funding_calls")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(
        `Supabase manual funding call delete failed: ${error.message}`,
      );
    }
  }

  async upsertManualFundingCall(record: FundingCall) {
    if (!this.isAdmin()) {
      throw new Error(
        "Manual funding call import/upsert is available only to admin tools.",
      );
    }

    const parsedRecord = fundingCallSchema.parse({
      ...record,
      sourceType: "manual",
    });
    const existingCall = await this.getManualFundingCall(parsedRecord.id);
    const { data, error } = await getSupabaseClient()
      .from("manual_funding_calls")
      .upsert(fundingCallToRow(parsedRecord, null), { onConflict: "id" })
      .select("*")
      .single<ManualFundingCallRow>();

    if (error) {
      throw new Error(
        `Supabase manual funding call upsert failed: ${error.message}`,
      );
    }

    return {
      action: existingCall ? "updated" : "created",
      record: parseFundingCallRowOrThrow(data),
    } as const;
  }

  async listSavedScans(): Promise<SavedScan[]> {
    return (await this.readSavedScanRows()).records.toSorted((first, second) => {
      return second.createdAt.localeCompare(first.createdAt);
    });
  }

  async getSavedScan(id: string): Promise<SavedScan | null> {
    if (!this.isAdmin() && !this.scope.userId) {
      return null;
    }

    let query = getSupabaseClient()
      .from("saved_scans")
      .select("*")
      .eq("id", id);

    if (!this.isAdmin()) {
      query = query.eq("user_id", this.requireUserId("read saved scans"));
    }

    const { data, error } = await query.maybeSingle<SavedScanRow>();

    if (error) {
      throw new Error(`Supabase saved scan lookup failed: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const mappedScan = mapSavedScanRow(data);
    const result = savedScanSchema.safeParse(mappedScan);

    if (result.success) {
      return result.data;
    }

    logSupabaseValidationWarning(
      "Invalid Supabase saved scan row skipped",
      buildValidationError("savedScans", null, data, result.error),
    );

    return null;
  }

  async createSavedScan(input: SavedScanInput): Promise<SavedScan> {
    const userId = this.requireUserId("save scans");
    const now = new Date().toISOString();
    const scan = savedScanSchema.parse({
      id: `scan-${randomUUID()}`,
      userId,
      projectId: input.projectId,
      projectName: input.projectName,
      result: input.result,
      createdAt: now,
    });
    const { data, error } = await getSupabaseClient()
      .from("saved_scans")
      .insert(savedScanToRow(scan))
      .select("*")
      .single<SavedScanRow>();

    if (error) {
      throw new Error(`Supabase saved scan create failed: ${error.message}`);
    }

    return parseSavedScanRowOrThrow(data);
  }

  async deleteSavedScan(id: string): Promise<void> {
    const userId = this.requireUserId("delete saved scans");
    const { error } = await getSupabaseClient()
      .from("saved_scans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Supabase saved scan delete failed: ${error.message}`);
    }
  }

  async getValidationDiagnostics() {
    const [projects, manualFundingCalls, savedScans] = await Promise.all([
      this.readProjectRows(),
      this.readManualFundingCallRows(),
      this.readSavedScanRows(),
    ]);

    return {
      projectsLoaded: projects.records.length,
      manualFundingCallsLoaded: manualFundingCalls.records.length,
      savedScansLoaded: savedScans.records.length,
      validationErrors: [
        ...projects.validationErrors,
        ...manualFundingCalls.validationErrors,
        ...savedScans.validationErrors,
      ],
    };
  }

  private async readProjectRows(): Promise<ReadResult<ProjectProfile>> {
    let query = getSupabaseClient()
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!this.isAdmin()) {
      const demoProjectId = getPublicDemoProjectId();

      if (this.scope.userId) {
        query = query.or(`user_id.eq.${this.scope.userId},id.eq.${demoProjectId}`);
      } else {
        query = query.eq("id", demoProjectId);
      }
    }

    const { data, error } = await query.returns<ProjectRow[]>();

    if (error) {
      throw new Error(`Supabase project list failed: ${error.message}`);
    }

    return parseRows({
      collection: "projects",
      rows: data ?? [],
      mapRow: mapProjectRow,
      schema: projectProfileSchema,
      warningMessage: "Invalid Supabase project row skipped",
    });
  }

  private async readManualFundingCallRows(): Promise<ReadResult<FundingCall>> {
    if (!this.isAdmin() && !this.scope.userId) {
      return { records: [], validationErrors: [] };
    }

    let query = getSupabaseClient()
      .from("manual_funding_calls")
      .select("*")
      .order("retrieved_at", { ascending: false, nullsFirst: false });

    if (!this.isAdmin()) {
      query = query.eq("user_id", this.requireUserId("read manual calls"));
    }

    const { data, error } = await query.returns<ManualFundingCallRow[]>();

    if (error) {
      throw new Error(
        `Supabase manual funding call list failed: ${error.message}`,
      );
    }

    return parseRows({
      collection: "manualFundingCalls",
      rows: data ?? [],
      mapRow: mapManualFundingCallRow,
      schema: fundingCallSchema,
      warningMessage: "Invalid Supabase manual funding call row skipped",
    });
  }

  private async readSavedScanRows(): Promise<ReadResult<SavedScan>> {
    if (!this.isAdmin() && !this.scope.userId) {
      return { records: [], validationErrors: [] };
    }

    let query = getSupabaseClient()
      .from("saved_scans")
      .select("*")
      .order("created_at", { ascending: false });

    if (!this.isAdmin()) {
      query = query.eq("user_id", this.requireUserId("read saved scans"));
    }

    const { data, error } = await query.returns<SavedScanRow[]>();

    if (error) {
      throw new Error(`Supabase saved scan list failed: ${error.message}`);
    }

    return parseRows({
      collection: "savedScans",
      rows: data ?? [],
      mapRow: mapSavedScanRow,
      schema: savedScanSchema,
      warningMessage: "Invalid Supabase saved scan row skipped",
    });
  }

  private async createUniqueId(tableName: string, seed: string) {
    const baseId = slugify(seed) || `record-${Date.now().toString(36)}`;
    let candidate = baseId;
    let counter = 2;

    while (await this.idExists(tableName, candidate)) {
      candidate = `${baseId}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  private async idExists(tableName: string, id: string) {
    const { data, error } = await getSupabaseClient()
      .from(tableName)
      .select("id")
      .eq("id", id)
      .limit(1);

    if (error) {
      throw new Error(`Supabase id lookup failed: ${error.message}`);
    }

    return Boolean(data && data.length > 0);
  }

  private isAdmin() {
    return this.scope.mode === "admin";
  }

  private isPublicDemoProject(id: string) {
    return id === getPublicDemoProjectId();
  }

  private canReadProject(id: string) {
    return this.isAdmin() || this.isPublicDemoProject(id) || Boolean(this.scope.userId);
  }

  private requireUserId(operation: string) {
    if (this.scope.userId) {
      return this.scope.userId;
    }

    throw new Error(`You must be logged in to ${operation}.`);
  }
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  // Server-only service role client. Never import this module from client
  // components, and never expose the key through diagnostics or logs.
  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

function projectInputToRow(
  input: ProjectProfileInput,
  metadata: {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  },
) {
  return {
    id: metadata.id,
    user_id: metadata.userId,
    name: input.name,
    short_description: input.shortDescription,
    country: input.country,
    sectors: input.sectors,
    technologies: input.technologies,
    target_users: input.targetUsers,
    problem_solved: input.problemSolved,
    solution: input.solution,
    stage: input.stage,
    trl: input.trl ?? null,
    preferred_funding_types: input.preferredFundingTypes,
    keywords: input.keywords,
    avoid: input.avoid,
    scoring_weights: input.scoringWeights,
    created_at: metadata.createdAt,
    updated_at: metadata.updatedAt,
  };
}

function projectToRow(project: ProjectProfile, userId: string | null) {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    short_description: project.shortDescription,
    country: project.country,
    sectors: project.sectors,
    technologies: project.technologies,
    target_users: project.targetUsers,
    problem_solved: project.problemSolved,
    solution: project.solution,
    stage: project.stage,
    trl: project.trl ?? null,
    preferred_funding_types: project.preferredFundingTypes,
    keywords: project.keywords,
    avoid: project.avoid,
    scoring_weights: project.scoringWeights,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

function fundingCallInputToRow(
  input: FundingCallInput,
  metadata: {
    id: string;
    userId: string;
    retrievedAt: string;
    createdAt: string | null;
    updatedAt: string;
  },
) {
  return {
    id: metadata.id,
    user_id: metadata.userId,
    title: input.title,
    programme: input.programme,
    topic_id: input.topicId,
    status: input.status,
    deadline: input.deadline,
    budget: input.budget,
    url: input.url,
    description: input.description,
    eligibility: input.eligibility,
    source_name: input.sourceName || MANUAL_FUNDING_SOURCE_NAME,
    source_type: "manual",
    source_url: input.sourceUrl ?? input.url,
    retrieved_at: metadata.retrievedAt,
    updated_at: metadata.updatedAt,
    ...(metadata.createdAt ? { created_at: metadata.createdAt } : {}),
  };
}

function fundingCallToRow(call: FundingCall, userId: string | null) {
  const now = new Date().toISOString();

  return {
    id: call.id,
    user_id: userId,
    title: call.title,
    programme: call.programme,
    topic_id: call.topicId,
    status: call.status,
    deadline: call.deadline,
    budget: call.budget,
    url: call.url ?? null,
    description: call.description,
    eligibility: call.eligibility,
    source_name: call.sourceName ?? MANUAL_FUNDING_SOURCE_NAME,
    source_type: "manual",
    source_url: call.sourceUrl ?? call.url ?? null,
    retrieved_at: call.retrievedAt ?? now,
    updated_at: now,
  };
}

function savedScanToRow(scan: SavedScan) {
  return {
    id: scan.id,
    user_id: scan.userId,
    project_id: scan.projectId,
    project_name: scan.projectName ?? null,
    result: scan.result,
    created_at: scan.createdAt,
  };
}

function mapProjectRow(row: ProjectRow) {
  const fallbackTimestamp = new Date().toISOString();

  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    country: row.country ?? "",
    sectors: normalizeStringArray(row.sectors),
    technologies: normalizeStringArray(row.technologies),
    targetUsers: normalizeTextValue(row.target_users),
    problemSolved: row.problem_solved ?? "",
    solution: row.solution ?? "",
    stage: row.stage,
    trl: row.trl ?? undefined,
    preferredFundingTypes: normalizeStringArray(row.preferred_funding_types),
    keywords: normalizeStringArray(row.keywords),
    avoid: normalizeStringArray(row.avoid),
    scoringWeights: row.scoring_weights,
    createdAt: normalizeTimestamp(row.created_at, fallbackTimestamp),
    updatedAt: normalizeTimestamp(row.updated_at, fallbackTimestamp),
  };
}

function mapManualFundingCallRow(row: ManualFundingCallRow) {
  return {
    id: row.id,
    title: row.title,
    programme: row.programme ?? "",
    topicId: row.topic_id ?? "",
    status: row.status ?? "",
    deadline: row.deadline ?? "",
    budget: row.budget ?? "",
    url: row.url ?? "",
    description: row.description ?? "",
    eligibility: row.eligibility ?? "",
    sourceName: row.source_name ?? MANUAL_FUNDING_SOURCE_NAME,
    sourceType: row.source_type ?? "manual",
    sourceUrl: row.source_url ?? undefined,
    retrievedAt: normalizeTimestamp(row.retrieved_at, undefined),
  };
}

function mapSavedScanRow(row: SavedScanRow) {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    projectName: row.project_name ?? undefined,
    result: row.result,
    createdAt: normalizeTimestamp(row.created_at, new Date().toISOString()),
  };
}

function parseProjectRowOrThrow(row: ProjectRow) {
  return projectProfileSchema.parse(mapProjectRow(row));
}

function parseFundingCallRowOrThrow(row: ManualFundingCallRow) {
  return fundingCallSchema.parse(mapManualFundingCallRow(row));
}

function parseSavedScanRowOrThrow(row: SavedScanRow) {
  return savedScanSchema.parse(mapSavedScanRow(row));
}

function parseRows<Row, Parsed>({
  collection,
  rows,
  mapRow,
  schema,
  warningMessage,
}: {
  collection: StorageValidationError["collection"];
  rows: Row[];
  mapRow: (row: Row) => unknown;
  schema: z.ZodType<Parsed>;
  warningMessage: string;
}): ReadResult<Parsed> {
  const records: Parsed[] = [];
  const validationErrors: StorageValidationError[] = [];

  rows.forEach((row, index) => {
    const mappedRow = mapRow(row);
    const result = schema.safeParse(mappedRow);

    if (result.success) {
      records.push(result.data);
      return;
    }

    const validationError = buildValidationError(
      collection,
      index,
      row,
      result.error,
    );
    validationErrors.push(validationError);
    logSupabaseValidationWarning(warningMessage, validationError);
  });

  return { records, validationErrors };
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => {
      return typeof item === "string" && item.trim().length > 0;
    });
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeTextValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .join(", ");
  }

  return "";
}

function normalizeTimestamp(value: string | null, fallback: string): string;
function normalizeTimestamp(
  value: string | null,
  fallback: undefined,
): string | undefined;
function normalizeTimestamp(value: string | null, fallback?: string) {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return parsedDate.toISOString();
}

function buildValidationError(
  collection: StorageValidationError["collection"],
  index: number | null,
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

function logSupabaseValidationWarning(
  message: string,
  metadata: StorageValidationError,
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[supabase-storage] ${message}`, metadata);
}
