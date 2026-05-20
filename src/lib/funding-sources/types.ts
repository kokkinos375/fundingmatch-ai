import type {
  FundingCall,
  FundingSourceType,
  ProjectProfile,
} from "@/lib/schemas";

export interface FundingSource {
  name: string;
  type: FundingSourceType;
  searchCalls(project: ProjectProfile): Promise<FundingCall[]>;
}

export type FundingSourceDiagnostics = {
  name: string;
  type: FundingSourceType;
  enabled: boolean;
};
