export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '');
}

function parseVersion(version: string) {
  const normalized = normalizeVersion(version || '0.0.0');
  const [corePart, prereleasePart = ''] = normalized.split('-', 2);

  return {
    core: corePart
      .split('.')
      .map((segment) => Number.parseInt(segment, 10) || 0),
    prerelease: prereleasePart
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean),
    hasPreRelease: prereleasePart.length > 0,
  };
}

export function compareVersions(currentVersion: string, latestVersion: string): boolean {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);
  const maxLength = Math.max(current.core.length, latest.core.length);

  for (let index = 0; index < maxLength; index += 1) {
    const currentPart = current.core[index] ?? 0;
    const latestPart = latest.core[index] ?? 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  if (current.hasPreRelease && !latest.hasPreRelease) {
    return false;
  }

  if (!current.hasPreRelease && latest.hasPreRelease) {
    return false;
  }

  if (current.hasPreRelease && latest.hasPreRelease) {
    const maxPrereleaseLength = Math.max(current.prerelease.length, latest.prerelease.length);

    for (let index = 0; index < maxPrereleaseLength; index += 1) {
      const currentPart = current.prerelease[index];
      const latestPart = latest.prerelease[index];

      if (latestPart === undefined) return false;
      if (currentPart === undefined) return true;

      const latestNumeric = Number.parseInt(latestPart, 10);
      const currentNumeric = Number.parseInt(currentPart, 10);

      if (!Number.isNaN(latestNumeric) && !Number.isNaN(currentNumeric)) {
        if (latestNumeric > currentNumeric) return true;
        if (latestNumeric < currentNumeric) return false;
        continue;
      }

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
  }

  return false;
}
