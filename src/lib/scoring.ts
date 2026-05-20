import {
  defaultScoringWeights,
  type FundingCall,
  type FundingMatchScores,
  type ProjectProfile,
  type Verdict,
} from "@/lib/schemas";

const euCountries = new Set([
  "austria",
  "belgium",
  "bulgaria",
  "croatia",
  "cyprus",
  "czech republic",
  "czechia",
  "denmark",
  "estonia",
  "finland",
  "france",
  "germany",
  "greece",
  "hungary",
  "ireland",
  "italy",
  "latvia",
  "lithuania",
  "luxembourg",
  "malta",
  "netherlands",
  "poland",
  "portugal",
  "romania",
  "slovakia",
  "slovenia",
  "spain",
  "sweden",
]);

const fundingTypeTerms = {
  grant: ["grant", "grants", "co-financed", "lump sum"],
  equity: ["equity", "investment", "investor"],
  loan: ["loan", "debt", "guarantee"],
  voucher: ["voucher", "vouchers", "cascade funding", "testing services"],
  pilot: ["pilot", "pilots", "demonstration", "validation site"],
  accelerator: ["accelerator", "mentoring", "market access"],
  procurement: ["procurement", "public buyers", "contracts", "pcp"],
} as const;

const stageTerms = {
  idea: ["idea", "feasibility", "concept"],
  prototype: ["prototype", "r&d", "trl 4", "trl 5"],
  pilot: ["pilot", "demonstration", "validation", "trl 6", "trl 7"],
  early_revenue: ["market", "traction", "early revenue", "go-to-market"],
  scaling: ["scale", "scale-up", "deployment", "commercial ambition"],
} as const;

export function calculateFundingMatchScores(
  project: ProjectProfile,
  call: FundingCall,
  referenceDate = new Date(),
): FundingMatchScores {
  const callText = normalizeText(
    [
      call.title,
      call.programme,
      call.topicId,
      call.status,
      call.description,
      call.eligibility,
      call.budget,
    ].join(" "),
  );

  const avoidPenalty = calculateAvoidPenalty(project.avoid, callText);
  const topicFit = clampScore(
    calculateTopicFit(project, callText) - avoidPenalty,
  );
  const eligibilityFit = clampScore(
    calculateEligibilityFit(project, callText) - avoidPenalty * 0.45,
  );
  const fundingFit = clampScore(
    calculateFundingFit(project, callText) - avoidPenalty * 0.55,
  );
  const stageFit = clampScore(
    calculateStageFit(project, callText) - avoidPenalty * 0.35,
  );
  const deadlineFit = calculateDeadlineFit(call, referenceDate);
  const competitionRisk = clampScore(
    calculateCompetitionRisk(call, topicFit) + avoidPenalty * 0.7,
  );
  const strategicValue = clampScore(
    Math.round(topicFit * 0.45 + stageFit * 0.2 + fundingFit * 0.15 + 18) -
      avoidPenalty,
  );

  const scoresWithoutFinal = {
    topicFit,
    eligibilityFit,
    fundingFit,
    stageFit,
    deadlineFit,
    competitionRisk,
    strategicValue,
  };

  return {
    ...scoresWithoutFinal,
    finalScore: calculateFinalScore(scoresWithoutFinal, project.scoringWeights),
  };
}

export function calculateFinalScore(
  scores: Omit<FundingMatchScores, "finalScore">,
  weights = defaultScoringWeights,
) {
  const totalWeight = Object.values(weights).reduce((sum, weight) => {
    return sum + weight;
  }, 0);

  const safeWeights = totalWeight > 0 ? weights : defaultScoringWeights;
  const safeTotalWeight =
    totalWeight > 0
      ? totalWeight
      : Object.values(defaultScoringWeights).reduce((sum, weight) => {
          return sum + weight;
        }, 0);

  const weightedScore =
    scores.topicFit * safeWeights.topicFit +
    scores.eligibilityFit * safeWeights.eligibilityFit +
    scores.fundingFit * safeWeights.fundingFit +
    scores.stageFit * safeWeights.stageFit +
    scores.deadlineFit * safeWeights.deadlineFit +
    (100 - scores.competitionRisk) * safeWeights.competitionRisk +
    scores.strategicValue * safeWeights.strategicValue;

  return clampScore(weightedScore / safeTotalWeight);
}

export function verdictFromScore(finalScore: number): Verdict {
  if (finalScore >= 85) {
    return "excellent_match";
  }

  if (finalScore >= 70) {
    return "good_match";
  }

  if (finalScore >= 55) {
    return "possible_match";
  }

  if (finalScore >= 40) {
    return "weak_match";
  }

  return "not_recommended";
}

function calculateTopicFit(project: ProjectProfile, callText: string) {
  const sectorHits = ratioScore(project.sectors, callText);
  const technologyHits = ratioScore(project.technologies, callText);
  const keywordHits = ratioScore(project.keywords, callText);

  const problemTerms = extractImportantTerms(
    `${project.shortDescription} ${project.problemSolved} ${project.solution}`,
  );
  const problemHitScore = ratioScore(problemTerms, callText);

  return clampScore(
    28 +
      sectorHits * 0.25 +
      technologyHits * 0.25 +
      keywordHits * 0.25 +
      problemHitScore * 0.25,
  );
}

function calculateEligibilityFit(project: ProjectProfile, callText: string) {
  const country = project.country.trim().toLowerCase();
  const euEligible =
    callText.includes("eu member states") ||
    callText.includes("associated countries") ||
    callText.includes("europe");
  const countryMentioned = callText.includes(country);
  const isEuCountry = euCountries.has(country);
  const startupEligible =
    callText.includes("startup") ||
    callText.includes("sme") ||
    callText.includes("companies");
  const consortiumRequired =
    callText.includes("consortium") || callText.includes("partners");

  let score = 45;

  if (countryMentioned) {
    score += 35;
  } else if (euEligible && isEuCountry) {
    score += 30;
  } else if (euEligible) {
    score += 15;
  }

  if (startupEligible) {
    score += 12;
  }

  if (consortiumRequired) {
    score -= 8;
  }

  return clampScore(score);
}

function calculateFundingFit(project: ProjectProfile, callText: string) {
  const preferred = project.preferredFundingTypes;
  const hits = preferred.filter((type) => {
    return fundingTypeTerms[type].some((term) => callText.includes(term));
  });

  if (hits.length === 0) {
    return preferred.length > 0 ? 32 : 65;
  }

  const directFit = (hits.length / preferred.length) * 78;
  return clampScore(20 + directFit);
}

function calculateStageFit(project: ProjectProfile, callText: string) {
  const trlRange = extractTrlRange(callText);

  if (project.trl && trlRange) {
    const [min, max] = trlRange;

    if (project.trl >= min && project.trl <= max) {
      return 92;
    }

    const distance =
      project.trl < min ? min - project.trl : project.trl - max;
    return clampScore(92 - distance * 18);
  }

  const stageHit = stageTerms[project.stage].some((term) => {
    return callText.includes(term);
  });

  if (stageHit) {
    return 82;
  }

  const adjacentStageScore = project.trl
    ? Math.max(40, 90 - Math.abs(project.trl - 6) * 10)
    : 58;

  return clampScore(adjacentStageScore);
}

function calculateDeadlineFit(call: FundingCall, referenceDate: Date) {
  const status = call.status.toLowerCase();

  if (status.includes("closed")) {
    return 5;
  }

  if (status.includes("draft")) {
    return 68;
  }

  const deadline = new Date(`${call.deadline}T23:59:59.000Z`);

  if (Number.isNaN(deadline.getTime())) {
    return status.includes("open") ? 75 : 55;
  }

  const daysRemaining = Math.ceil(
    (deadline.getTime() - referenceDate.getTime()) / 86_400_000,
  );

  if (daysRemaining < 0) {
    return 4;
  }

  if (daysRemaining <= 14) {
    return 48;
  }

  if (daysRemaining <= 45) {
    return 72;
  }

  if (daysRemaining <= 150) {
    return 95;
  }

  return 82;
}

function calculateCompetitionRisk(call: FundingCall, topicFit: number) {
  const programme = normalizeText(call.programme);
  let base = 55;

  if (programme.includes("eic accelerator")) {
    base = 84;
  } else if (programme.includes("horizon")) {
    base = 72;
  } else if (programme.includes("life")) {
    base = 62;
  } else if (programme.includes("digital europe")) {
    base = 54;
  } else if (programme.includes("eurostars")) {
    base = 58;
  } else if (programme.includes("eit")) {
    base = 50;
  } else if (programme.includes("procurement")) {
    base = 48;
  }

  const budgetText = normalizeText(call.budget);
  const largeBudgetBump =
    budgetText.includes("million") || budgetText.includes("equity") ? 8 : 0;
  const nicheFitAdjustment = topicFit >= 78 ? -8 : topicFit < 50 ? 8 : 0;

  return clampScore(base + largeBudgetBump + nicheFitAdjustment);
}

function calculateAvoidPenalty(avoidTerms: string[], callText: string) {
  const hits = avoidTerms.filter((term) => {
    return term.trim().length > 0 && callText.includes(normalizeText(term));
  });

  return Math.min(30, hits.length * 15);
}

function ratioScore(terms: string[], callText: string) {
  const cleanTerms = Array.from(
    new Set(
      terms
        .map((term) => normalizeText(term))
        .filter((term) => term.length > 1),
    ),
  );

  if (cleanTerms.length === 0) {
    return 0;
  }

  const hits = cleanTerms.filter((term) => {
    return callText.includes(term) || term.split(" ").some((part) => {
      return part.length > 3 && callText.includes(part);
    });
  });

  return (hits.length / cleanTerms.length) * 100;
}

function extractImportantTerms(text: string) {
  const stopWords = new Set([
    "with",
    "from",
    "that",
    "this",
    "need",
    "needs",
    "while",
    "their",
    "into",
    "around",
    "through",
    "using",
    "teams",
    "users",
    "project",
  ]);

  return normalizeText(text)
    .split(/\s+/)
    .filter((term) => term.length > 4 && !stopWords.has(term))
    .slice(0, 24);
}

function extractTrlRange(text: string): [number, number] | null {
  const rangeMatch = text.match(/trl\s*(\d)\s*[-–]\s*(\d)/);

  if (rangeMatch) {
    return [Number(rangeMatch[1]), Number(rangeMatch[2])];
  }

  const singleMatch = text.match(/trl\s*(\d)/);

  if (singleMatch) {
    const trl = Number(singleMatch[1]);
    return [trl, trl];
  }

  return null;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
