import "server-only";

import { getCurrentUser } from "@/lib/auth";
import {
  getPublicDemoProjectId,
  getPublicDemoProjectProfile,
  isLegacyPrivateDemoProjectId,
  isPublicDemoProjectId,
} from "@/lib/public-demo";
import type { ProjectProfile } from "@/lib/schemas";
import { getStorageForUser } from "@/lib/storage";

export async function getVisibleProjectsForCurrentUser() {
  const user = await getCurrentUser();
  const storage = getStorageForUser(user?.id ?? null);
  const projects = (await storage.listProjects()).filter((project) => {
    return !isLegacyPrivateDemoProjectId(project.id);
  });
  const demoProject = getPublicDemoProjectProfile();

  if (
    demoProject &&
    !projects.some((project) => project.id === demoProject.id)
  ) {
    projects.push(demoProject);
  }

  return {
    projects: sortProjects(projects),
    user,
  };
}

export async function getProjectForCurrentUser(projectId: string) {
  if (isLegacyPrivateDemoProjectId(projectId)) {
    return { project: null, user: await getCurrentUser() };
  }

  const user = await getCurrentUser();
  const storage = getStorageForUser(user?.id ?? null);
  let project = await storage.getProject(projectId);

  if (!project && projectId === getPublicDemoProjectId()) {
    project = getPublicDemoProjectProfile();
  }

  return { project, user };
}

export async function getPrivateProjectForCurrentUser(projectId: string) {
  if (isPublicDemoProjectId(projectId) || isLegacyPrivateDemoProjectId(projectId)) {
    return { project: null, user: await getCurrentUser() };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { project: null, user };
  }

  const project = await getStorageForUser(user.id).getProject(projectId);

  return { project, user };
}

function sortProjects(projects: ProjectProfile[]) {
  return projects.toSorted((first, second) => {
    return second.updatedAt.localeCompare(first.updatedAt);
  });
}
