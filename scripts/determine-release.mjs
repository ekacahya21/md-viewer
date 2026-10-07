import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Patterns for files that do NOT require application deployment or SemVer releases.
 */
export const NON_DEPLOYABLE_PATTERNS = [
  /^README(\.[^.]+)?$/i,
  /\.md$/i,
  /^docs\//i,
  /^\.github\//i,
  /^\.gitignore$/,
  /^\.gitattributes$/,
  /^\.prettierrc(\.[^.]+)?$/,
  /^oxlint\.json$/,
  /^tests\//i,
  /\.(test|spec)\.[cm]?[jt]sx?$/i,
  /^(vitest|playwright)\.config\.[jt]s$/i
];

/**
 * Checks whether a given changed file path requires deployment.
 * Returns true if the file impacts production code/assets/runtime.
 */
export function isDeployableFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const normalized = filePath.trim().replace(/\\/g, '/');
  if (!normalized) return false;

  for (const pattern of NON_DEPLOYABLE_PATTERNS) {
    if (pattern.test(normalized)) {
      return false;
    }
  }
  return true;
}

/**
 * Analyzes commit / PR title and body according to Conventional Commits specification.
 */
export function detectCommitType(title = '', body = '') {
  const safeTitle = (title || '').trim();
  const safeBody = (body || '').trim();

  // Breaking change checks:
  // 1. Title contains exclamation before colon: feat!: or feat(api)!:
  // 2. Title or Body contains BREAKING CHANGE: or BREAKING CHANGES:
  const hasBreakingBang = /^[a-z0-9_-]+(\([^)]+\))?!:/i.test(safeTitle);
  const hasBreakingText =
    /BREAKING[ -]CHANGES?:/i.test(safeTitle) || /BREAKING[ -]CHANGES?:/i.test(safeBody);

  const isBreaking = hasBreakingBang || hasBreakingText;

  // Type extraction (supports optional scope and optional exclamation mark)
  const typeMatch = safeTitle.match(/^([a-z0-9_-]+)(\([^)]+\))?!?:/i);
  const type = typeMatch ? typeMatch[1].toLowerCase() : 'other';

  return {
    isBreaking,
    type
  };
}

/**
 * Calculates the next SemVer version string given current version and bump type.
 */
export function calculateNextVersion(currentVersion, bumpType) {
  const clean = (currentVersion || '1.0.0').replace(/^v/, '');
  const parts = clean.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid SemVer version string: "${currentVersion}"`);
  }

  let [major, minor, patch] = parts;

  switch (bumpType) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    case 'none':
    case 'skip':
      return clean;
    default:
      throw new Error(`Unknown bump type: "${bumpType}"`);
  }

  return `${major}.${minor}.${patch}`;
}

/**
 * Determines whether to release/deploy and which SemVer bump to apply.
 */
export function determineRelease({
  title = '',
  body = '',
  changedFiles = [],
  bumpOverride = 'auto',
  currentVersion = '1.0.0'
} = {}) {
  // 1. Handle manual workflow_dispatch override
  if (bumpOverride && bumpOverride !== 'auto') {
    if (bumpOverride === 'skip' || bumpOverride === 'none') {
      return {
        shouldDeploy: false,
        bumpType: 'none',
        currentVersion,
        newVersion: currentVersion,
        newTag: '',
        reason: 'Release skipped by manual workflow override'
      };
    }

    if (['patch', 'minor', 'major'].includes(bumpOverride)) {
      const newVersion = calculateNextVersion(currentVersion, bumpOverride);
      return {
        shouldDeploy: true,
        bumpType: bumpOverride,
        currentVersion,
        newVersion,
        newTag: `v${newVersion}`,
        reason: `Manual override specified: ${bumpOverride}`
      };
    }
  }

  // 2. Check changed files
  const filesList = Array.isArray(changedFiles)
    ? changedFiles
    : String(changedFiles)
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

  const hasFiles = filesList.length > 0;
  const deployableFiles = filesList.filter(isDeployableFile);

  // If files were provided and NONE are deployable (only docs/tests/ci):
  if (hasFiles && deployableFiles.length === 0) {
    return {
      shouldDeploy: false,
      bumpType: 'none',
      currentVersion,
      newVersion: currentVersion,
      newTag: '',
      reason: 'Only non-deployable files (documentation, CI configs, or tests) were modified'
    };
  }

  // 3. Analyze Conventional Commits title and body
  const { isBreaking, type } = detectCommitType(title, body);

  if (isBreaking) {
    const newVersion = calculateNextVersion(currentVersion, 'major');
    return {
      shouldDeploy: true,
      bumpType: 'major',
      currentVersion,
      newVersion,
      newTag: `v${newVersion}`,
      reason: 'Breaking change detected in PR (major release)'
    };
  }

  if (type === 'feat') {
    const newVersion = calculateNextVersion(currentVersion, 'minor');
    return {
      shouldDeploy: true,
      bumpType: 'minor',
      currentVersion,
      newVersion,
      newTag: `v${newVersion}`,
      reason: 'New feature detected in PR (minor release)'
    };
  }

  // If no files list was provided but commit type explicitly indicates non-deployable:
  if (!hasFiles && ['docs', 'test', 'ci', 'style'].includes(type)) {
    return {
      shouldDeploy: false,
      bumpType: 'none',
      currentVersion,
      newVersion: currentVersion,
      newTag: '',
      reason: `PR type '${type}' indicates non-deployable changes`
    };
  }

  // 4. Default for any other code modification (fix, perf, refactor, chore, or untyped):
  const newVersion = calculateNextVersion(currentVersion, 'patch');
  return {
    shouldDeploy: true,
    bumpType: 'patch',
    currentVersion,
    newVersion,
    newTag: `v${newVersion}`,
    reason: `Deployable changes detected (patch release for ${type || 'code update'})`
  };
}

/**
 * CLI execution handler
 */
function main() {
  const rootDir = process.cwd();
  const pkgPath = path.join(rootDir, 'package.json');
  let currentVersion = '1.0.0';

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) currentVersion = pkg.version;
    } catch (e) {
      console.warn('Warning: Could not parse package.json, using fallback 1.0.0', e);
    }
  }

  const title = process.env.PR_TITLE || process.argv[2] || '';
  const body = process.env.PR_BODY || process.argv[3] || '';
  const bumpOverride = process.env.BUMP_OVERRIDE || process.argv[4] || 'auto';

  // Changed files can be passed via env CHANGED_FILES or CHANGED_FILES_FILE
  let changedFiles = [];
  if (process.env.CHANGED_FILES_FILE && fs.existsSync(process.env.CHANGED_FILES_FILE)) {
    changedFiles = fs.readFileSync(process.env.CHANGED_FILES_FILE, 'utf8').split('\n');
  } else if (process.env.CHANGED_FILES) {
    changedFiles = process.env.CHANGED_FILES.split('\n');
  }

  const result = determineRelease({
    title,
    body,
    changedFiles,
    bumpOverride,
    currentVersion
  });

  console.log('--- Release Analysis Result ---');
  console.log(`Current Version: ${result.currentVersion}`);
  console.log(`Should Deploy:   ${result.shouldDeploy}`);
  console.log(`Bump Type:       ${result.bumpType}`);
  console.log(`New Version:     ${result.newVersion}`);
  console.log(`New Tag:         ${result.newTag}`);
  console.log(`Reason:          ${result.reason}`);
  console.log('-------------------------------');

  // If running inside GitHub Actions, populate GITHUB_OUTPUT
  if (process.env.GITHUB_OUTPUT) {
    const outputs = [
      `should_deploy=${result.shouldDeploy}`,
      `bump_type=${result.bumpType}`,
      `current_version=${result.currentVersion}`,
      `new_version=${result.newVersion}`,
      `new_tag=${result.newTag}`,
      `reason=${result.reason.replace(/\n/g, ' ')}`
    ];
    fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs.join('\n') + '\n');
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main();
}
