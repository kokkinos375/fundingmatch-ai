import type {
  FundingSourceType,
  FundingType,
  ProjectStage,
  Verdict,
} from "@/lib/schemas";

export const stageLabels: Record<ProjectStage, string> = {
  idea: "Idea",
  prototype: "Prototype",
  pilot: "Pilot",
  early_revenue: "Early revenue",
  scaling: "Scaling",
};

export const fundingTypeLabels: Record<FundingType, string> = {
  grant: "Grant",
  equity: "Equity",
  loan: "Loan",
  voucher: "Voucher",
  pilot: "Pilot",
  accelerator: "Accelerator",
  procurement: "Procurement",
};

export const verdictLabels: Record<Verdict, string> = {
  excellent_match: "Excellent match",
  good_match: "Good match",
  possible_match: "Possible match",
  weak_match: "Weak match",
  not_recommended: "Not recommended",
};

export const verdictTone: Record<
  Verdict,
  "green" | "teal" | "amber" | "slate" | "red"
> = {
  excellent_match: "green",
  good_match: "teal",
  possible_match: "amber",
  weak_match: "slate",
  not_recommended: "red",
};

export const fundingSourceTypeLabels: Record<FundingSourceType, string> = {
  mock: "Mock",
  eu_portal: "EU Portal",
  manual: "Manual",
};
