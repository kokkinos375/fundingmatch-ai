import { z } from "zod";

export const projectStageSchema = z.enum([
  "idea",
  "prototype",
  "pilot",
  "early_revenue",
  "scaling",
]);

export const fundingTypeSchema = z.enum([
  "grant",
  "equity",
  "loan",
  "voucher",
  "pilot",
  "accelerator",
  "procurement",
]);

export const fundingSourceTypeSchema = z.enum(["mock", "eu_portal", "manual"]);

export const verdictSchema = z.enum([
  "excellent_match",
  "good_match",
  "possible_match",
  "weak_match",
  "not_recommended",
]);

export const aiProviderSchema = z.enum(["gemini", "openai"]);

export const scoringWeightsSchema = z.object({
  topicFit: z.number().min(0).max(5),
  eligibilityFit: z.number().min(0).max(5),
  fundingFit: z.number().min(0).max(5),
  stageFit: z.number().min(0).max(5),
  deadlineFit: z.number().min(0).max(5),
  competitionRisk: z.number().min(0).max(5),
  strategicValue: z.number().min(0).max(5),
});

export const defaultScoringWeights = {
  topicFit: 4,
  eligibilityFit: 3,
  fundingFit: 3,
  stageFit: 2,
  deadlineFit: 2,
  competitionRisk: 1,
  strategicValue: 3,
} satisfies z.infer<typeof scoringWeightsSchema>;

const stringListSchema = z.array(z.string().trim().min(1)).default([]);

export const httpUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL.")
  .refine((value) => {
    try {
      const url = new URL(value);

      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be a valid http or https URL.");

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

export const optionalHttpUrlSchema = z.preprocess(
  emptyStringToUndefined,
  httpUrlSchema.optional(),
);

export const projectProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2),
  shortDescription: z.string().trim().min(10),
  country: z.string().trim().min(2),
  sectors: stringListSchema,
  technologies: stringListSchema,
  targetUsers: z.string().trim().min(2),
  problemSolved: z.string().trim().min(10),
  solution: z.string().trim().min(10),
  stage: projectStageSchema,
  trl: z.number().int().min(1).max(9).optional(),
  preferredFundingTypes: z.array(fundingTypeSchema).min(1),
  keywords: stringListSchema,
  avoid: stringListSchema,
  scoringWeights: scoringWeightsSchema.default(defaultScoringWeights),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProjectProfileSchema = projectProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const fundingCallBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  programme: z.string().min(2),
  topicId: z.string().min(1),
  status: z.string().min(1),
  deadline: z.string().min(1),
  budget: z.string().min(1),
  url: optionalHttpUrlSchema,
  description: z.string().min(10),
  eligibility: z.string().min(10),
  sourceName: z.string().min(1).optional(),
  sourceType: fundingSourceTypeSchema.optional(),
  sourceUrl: optionalHttpUrlSchema,
  retrievedAt: z.string().datetime().optional(),
});

export const fundingCallSchema = fundingCallBaseSchema
  .superRefine((call, ctx) => {
    if (call.sourceType === "mock") {
      return;
    }

    if (!call.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Please provide the exact official call or application URL.",
      });
    }
  });

const boundedScoreSchema = z.number().min(0).max(100);

export const fundingMatchScoresSchema = z.object({
  topicFit: boundedScoreSchema,
  eligibilityFit: boundedScoreSchema,
  fundingFit: boundedScoreSchema,
  stageFit: boundedScoreSchema,
  deadlineFit: boundedScoreSchema,
  competitionRisk: boundedScoreSchema,
  strategicValue: boundedScoreSchema,
  finalScore: boundedScoreSchema,
});

export const fundingMatchExplanationSchema = z.object({
  whyItFits: z.array(z.string().min(1)).min(1),
  risks: z.array(z.string().min(1)).min(1),
  missingInfo: z.array(z.string().min(1)).min(1),
  recommendedNextStep: z.string().min(1),
});

export const fundingMatchSchema = z
  .object({
    call: fundingCallSchema,
    scores: fundingMatchScoresSchema,
    verdict: verdictSchema,
  })
  .merge(fundingMatchExplanationSchema);

export const fundingScanResultSchema = z.object({
  projectId: z.string().min(1),
  generatedAt: z.string().datetime(),
  matches: z.array(fundingMatchSchema),
  usedOpenAI: z.boolean(),
  usedAI: z.boolean().optional(),
  aiProvider: aiProviderSchema.optional(),
});

export const savedScanSchema = z.object({
  id: z.string().min(1),
  userId: z.string().uuid(),
  projectId: z.string().min(1),
  projectName: z.string().min(1).optional(),
  result: fundingScanResultSchema,
  createdAt: z.string().datetime(),
});

export type ProjectStage = z.infer<typeof projectStageSchema>;
export type FundingType = z.infer<typeof fundingTypeSchema>;
export type FundingSourceType = z.infer<typeof fundingSourceTypeSchema>;
export type AIProviderName = z.infer<typeof aiProviderSchema>;
export type ProjectProfile = z.infer<typeof projectProfileSchema>;
export type CreateProjectProfile = z.infer<typeof createProjectProfileSchema>;
export type FundingCall = z.infer<typeof fundingCallSchema>;
export type FundingMatchScores = z.infer<typeof fundingMatchScoresSchema>;
export type FundingMatchExplanation = z.infer<
  typeof fundingMatchExplanationSchema
>;
export type FundingMatch = z.infer<typeof fundingMatchSchema>;
export type FundingScanResult = z.infer<typeof fundingScanResultSchema>;
export type SavedScan = z.infer<typeof savedScanSchema>;
export type Verdict = z.infer<typeof verdictSchema>;
