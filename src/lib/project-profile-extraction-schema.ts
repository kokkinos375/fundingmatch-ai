import { z } from "zod";
import { fundingTypeSchema, projectStageSchema } from "@/lib/schemas";

export const projectProfileExtractionSchema = z.object({
  name: z.string().trim().min(2),
  shortDescription: z.string().trim().min(10),
  sectors: z.array(z.string().trim().min(1)).min(1).max(10),
  technologies: z.array(z.string().trim().min(1)).min(1).max(10),
  targetUsers: z.string().trim().min(2),
  problemSolved: z.string().trim().min(10),
  solution: z.string().trim().min(10),
  stage: projectStageSchema,
  keywords: z.array(z.string().trim().min(1)).min(1).max(16),
  preferredFundingTypes: z.array(fundingTypeSchema).min(1).max(7),
});

export type ProjectProfileExtraction = z.infer<
  typeof projectProfileExtractionSchema
>;
