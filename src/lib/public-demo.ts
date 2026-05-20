import { mockProjectProfiles } from "@/lib/mock-data";

const DEFAULT_PUBLIC_DEMO_PROJECT_ID = "ecosmart-demo";
const LEGACY_PRIVATE_DEMO_PROJECT_ID = "naviguard";

export function getPublicDemoProjectId() {
  return process.env.PUBLIC_DEMO_PROJECT_ID?.trim() || DEFAULT_PUBLIC_DEMO_PROJECT_ID;
}

export function getPublicDemoProjectProfile() {
  const demoProjectId = getPublicDemoProjectId();

  return (
    mockProjectProfiles.find((project) => project.id === demoProjectId) ??
    mockProjectProfiles.find(
      (project) => project.id === DEFAULT_PUBLIC_DEMO_PROJECT_ID,
    ) ??
    null
  );
}

export function isLegacyPrivateDemoProjectId(projectId: string) {
  return projectId === LEGACY_PRIVATE_DEMO_PROJECT_ID;
}
