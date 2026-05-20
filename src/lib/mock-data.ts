import {
  defaultScoringWeights,
  type FundingCall,
  type ProjectProfile,
} from "@/lib/schemas";

const seedTimestamp = "2026-05-19T09:00:00.000Z";

export const mockProjectProfiles: ProjectProfile[] = [
  {
    id: "ecosmart-demo",
    name: "EcoSmart Demo",
    shortDescription:
      "A generic example project using AI, sensors, and data analytics to monitor environmental conditions and identify suitable sustainability funding opportunities.",
    country: "Belgium",
    sectors: [
      "sustainability",
      "environment",
      "digital innovation",
      "monitoring technology",
    ],
    technologies: ["AI", "sensors", "data analytics"],
    targetUsers:
      "Sustainability teams, public organisations, facility operators, and innovation managers.",
    problemSolved:
      "Organisations need accessible environmental monitoring data to plan sustainability projects and identify relevant funding routes.",
    solution:
      "EcoSmart Demo combines sensor readings, AI-assisted analysis, and simple reporting workflows to highlight environmental trends and funding-ready pilot opportunities.",
    stage: "prototype",
    trl: 5,
    preferredFundingTypes: ["grant", "pilot", "accelerator"],
    keywords: [
      "sustainability",
      "environmental monitoring",
      "AI",
      "sensors",
      "digital innovation",
      "climate",
      "data analytics",
    ],
    avoid: ["defence-only calls", "pure equity"],
    scoringWeights: {
      ...defaultScoringWeights,
      topicFit: 4,
      strategicValue: 3,
    },
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
  },
];

export const mockFundingCalls: FundingCall[] = [
  {
    id: "horizon-climate-ocean-ai",
    title: "AI and Data Spaces for Climate-Resilient Ocean Operations",
    programme: "Horizon Europe",
    topicId: "HORIZON-CL6-2026-OCEAN-AI-01",
    status: "Open",
    deadline: "2026-10-07",
    budget: "EUR 6 million total, grants up to EUR 2 million",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
    description:
      "Mock Horizon Europe topic supporting AI, data sharing, sensing, and decision-support tools for climate-resilient ocean, coastal, port, and blue-economy operations. Strong fit for consortia validating digital technologies through pilots at TRL 5-7.",
    eligibility:
      "Open to legal entities in EU Member States and associated countries. Consortia should include technology providers, end users, and validation sites. Grant funding only; expected pilot demonstration and measurable environmental benefit.",
  },
  {
    id: "eic-accelerator-deep-tech",
    title: "Deep Tech Accelerator for High-Risk European Startups",
    programme: "EIC Accelerator",
    topicId: "EIC-ACCELERATOR-2026-OPEN",
    status: "Open",
    deadline: "2026-09-02",
    budget: "Grant up to EUR 2.5 million and optional equity investment",
    url: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en",
    description:
      "Mock EIC Accelerator call for startups and SMEs with breakthrough deep tech, high-risk innovation, strong commercial ambition, and credible scale-up plans. Suitable for AI, hardware, sensors, climate, energy, health, mobility, and industrial technologies.",
    eligibility:
      "Single startup or SME from an EU Member State or associated country. Best for TRL 6-8 projects with prototype evidence, freedom to operate, market traction, and a credible go-to-market plan. Grant and equity funding available.",
  },
  {
    id: "life-biodiversity-monitoring",
    title: "Biodiversity Protection and Nature Monitoring Pilots",
    programme: "LIFE Programme",
    topicId: "LIFE-2026-NAT-MONITORING",
    status: "Open",
    deadline: "2026-09-23",
    budget: "Co-financed grants, typical projects EUR 1-4 million",
    url: "https://cinea.ec.europa.eu/programmes/life_en",
    description:
      "Mock LIFE call for field pilots that protect biodiversity, reduce pressure on protected species, and deploy practical monitoring or mitigation methods. Digital and AI tools are eligible when they support measurable conservation outcomes.",
    eligibility:
      "Open to public bodies, private organizations, NGOs, and consortia in EU Member States. Projects should show environmental impact, implementation readiness, and replication potential. Grants and pilot actions are eligible.",
  },
  {
    id: "eurostars-sme-rd",
    title: "Eurostars Collaborative R&D for Market-Oriented SMEs",
    programme: "Eurostars",
    topicId: "EUROSTARS-2026-CALL-2",
    status: "Open",
    deadline: "2026-09-10",
    budget: "National grant rates vary by country",
    url: "https://www.eurekanetwork.org/programmes/eurostars/",
    description:
      "Mock Eurostars call for international R&D projects led by innovative SMEs. Supports market-oriented prototypes, pilots, and validation with partners across Europe in AI, digital, climate, industrial, agriculture, health, and mobility sectors.",
    eligibility:
      "Requires a consortium with at least two independent partners from participating countries. SME-led, civilian application, clear market potential, and TRL 4-7 R&D work packages. Grant funding depends on national rules.",
  },
  {
    id: "eit-urban-mobility-accelerator",
    title: "Urban Mobility and Port Logistics Accelerator",
    programme: "EIT Urban Mobility",
    topicId: "EIT-UM-2026-ACCELERATOR-PORTS",
    status: "Open",
    deadline: "2026-07-31",
    budget: "Accelerator services plus pilot vouchers up to EUR 60,000",
    url: "https://www.eiturbanmobility.eu/get-involved/calls/",
    description:
      "Mock accelerator for startups improving urban mobility, logistics, ports, emissions reduction, safety, infrastructure planning, and operational decision support. Emphasis on pilots with cities, port authorities, or mobility operators.",
    eligibility:
      "Open to startups in EU Member States and associated countries. Best for prototype, pilot, and early-revenue teams seeking pilots, mentoring, and market access. Voucher and accelerator support available.",
  },
  {
    id: "digital-europe-ai-vouchers",
    title: "AI Testing and Experimentation Voucher Scheme",
    programme: "Digital Europe Programme",
    topicId: "DIGITAL-2026-AI-TEF-VOUCHERS",
    status: "Open",
    deadline: "2026-08-30",
    budget: "Vouchers up to EUR 100,000 for testing services",
    url: "https://digital-strategy.ec.europa.eu/en/activities/digital-programme",
    description:
      "Mock Digital Europe cascade-funding scheme for SMEs using AI testing facilities, model validation, compliance checks, datasets, cyber-resilience reviews, and experimentation support before market deployment.",
    eligibility:
      "Open to SMEs and startups based in EU Member States or associated countries. Best for AI systems at TRL 4-8 that need testing, validation, standards readiness, or market-entry support. Voucher funding only.",
  },
  {
    id: "innovation-procurement-resilience",
    title: "Pre-Commercial Procurement for Resilient Public Infrastructure",
    programme: "Innovation Procurement",
    topicId: "PCP-2026-RESILIENT-INFRA",
    status: "Draft",
    deadline: "2026-11-15",
    budget: "Procurement contracts, phased awards up to EUR 500,000",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
    description:
      "Mock pre-commercial procurement for public buyers seeking solutions for resilient infrastructure, safety monitoring, environmental compliance, and operational decision support. Suppliers compete through feasibility, prototype, and pilot phases.",
    eligibility:
      "Open to companies able to deliver R&D services to public buyers. Best for prototype to pilot-stage teams with deployable technology, references, and procurement readiness. Procurement funding rather than grants.",
  },
];
