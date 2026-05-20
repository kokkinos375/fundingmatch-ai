import { z } from "zod";
import {
  createProjectProfileSchema,
  type CreateProjectProfile,
  type FundingCall,
  type ProjectProfile,
} from "@/lib/schemas";

export const MANUAL_FUNDING_SOURCE_NAME = "Manual Funding Calls";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

export const projectProfileInputSchema = createProjectProfileSchema;

export const fundingCallInputSchema = z.object({
  title: z.string().trim().min(2),
  programme: z.string().trim().min(2),
  topicId: z.string().trim().min(1),
  status: z.string().trim().min(1),
  deadline: z.string().trim().min(1),
  budget: z.string().trim().min(1),
  url: z.string().trim().url(),
  description: z.string().trim().min(10),
  eligibility: z.string().trim().min(10),
  sourceName: z
    .preprocess(emptyStringToUndefined, z.string().trim().min(1).optional())
    .default(MANUAL_FUNDING_SOURCE_NAME),
  sourceUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url().optional(),
  ),
});

export type ProjectProfileInput = CreateProjectProfile;
export type FundingCallInput = z.infer<typeof fundingCallInputSchema>;

export type StorageValidationError = {
  collection: "projects" | "manualFundingCalls";
  index: number | null;
  id?: string;
  title?: string;
  messages: string[];
};

export type StorageDiagnostics = {
  configuredDriver: StorageDriver;
  activeDriver: StorageDriver;
  localJsonActive: boolean;
  supabase: {
    selected: boolean;
    hasUrl: boolean;
    hasServiceRoleKey: boolean;
    ready: boolean;
    accessible: boolean | null;
    error?: string;
  };
  projectsLoaded: number | null;
  manualFundingCallsLoaded: number | null;
  validationErrorCounts: {
    projects: number | null;
    manualFundingCalls: number | null;
  };
};

export type StorageDriver = "local_json" | "supabase";
export type StorageUpsertAction = "created" | "updated";

export type StorageUpsertResult<T> = {
  action: StorageUpsertAction;
  record: T;
};

export interface AppStorage {
  listProjects(): Promise<ProjectProfile[]>;
  getProject(id: string): Promise<ProjectProfile | null>;
  createProject(input: ProjectProfileInput): Promise<ProjectProfile>;
  updateProject(
    id: string,
    input: ProjectProfileInput,
  ): Promise<ProjectProfile>;
  deleteProject(id: string): Promise<void>;
  upsertProject(
    record: ProjectProfile,
  ): Promise<StorageUpsertResult<ProjectProfile>>;

  listManualFundingCalls(): Promise<FundingCall[]>;
  getManualFundingCall(id: string): Promise<FundingCall | null>;
  createManualFundingCall(input: FundingCallInput): Promise<FundingCall>;
  updateManualFundingCall(
    id: string,
    input: FundingCallInput,
  ): Promise<FundingCall>;
  deleteManualFundingCall(id: string): Promise<void>;
  upsertManualFundingCall(
    record: FundingCall,
  ): Promise<StorageUpsertResult<FundingCall>>;
}
