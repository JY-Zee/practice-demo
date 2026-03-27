import fs from 'fs/promises';
import path from 'path';

import { resolveUploadDir } from '../config/env';

function getArtifactsRoot() {
  return path.join(resolveUploadDir(), '.artifacts');
}

export async function ensureArtifactDir(taskId: string) {
  const artifactDir = path.join(getArtifactsRoot(), taskId);
  await fs.mkdir(artifactDir, { recursive: true });
  return artifactDir;
}

export async function writeArtifactJson<T>(targetPath: string, payload: T) {
  await fs.writeFile(targetPath, JSON.stringify(payload, null, 2), 'utf8');
}

export async function readArtifactJson<T>(targetPath: string) {
  const raw = await fs.readFile(targetPath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function cleanupArtifactDir(artifactDir: string) {
  await fs.rm(artifactDir, { recursive: true, force: true });
}
