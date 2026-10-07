import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDeployableFile,
  detectCommitType,
  calculateNextVersion,
  determineRelease
} from '../scripts/determine-release.mjs';

test('isDeployableFile - correctly filters documentation and configs', () => {
  assert.equal(isDeployableFile('README.md'), false);
  assert.equal(isDeployableFile('docs/api.md'), false);
  assert.equal(isDeployableFile('.github/workflows/ci.yml'), false);
  assert.equal(isDeployableFile('.github/workflows/deploy.yml'), false);
  assert.equal(isDeployableFile('.gitignore'), false);
  assert.equal(isDeployableFile('.gitattributes'), false);
  assert.equal(isDeployableFile('oxlint.json'), false);
  assert.equal(isDeployableFile('vitest.config.ts'), false);
  assert.equal(isDeployableFile('tests/app.test.mjs'), false);
  assert.equal(isDeployableFile('src/components/Button.test.tsx'), false);
});

test('isDeployableFile - correctly flags deployable application files', () => {
  assert.equal(isDeployableFile('src/App.tsx'), true);
  assert.equal(isDeployableFile('src/components/Editor.tsx'), true);
  assert.equal(isDeployableFile('server/index.js'), true);
  assert.equal(isDeployableFile('Dockerfile'), true);
  assert.equal(isDeployableFile('docker-compose.yml'), true);
  assert.equal(isDeployableFile('caddy/Caddyfile'), true);
  assert.equal(isDeployableFile('package.json'), true);
  assert.equal(isDeployableFile('package-lock.json'), true);
  assert.equal(isDeployableFile('scripts/deploy.sh'), true);
});

test('detectCommitType - extracts breaking and conventional types', () => {
  assert.deepEqual(detectCommitType('feat: add dark mode'), {
    isBreaking: false,
    type: 'feat'
  });

  assert.deepEqual(detectCommitType('feat(editor)!: breaking editor rewrite'), {
    isBreaking: true,
    type: 'feat'
  });

  assert.deepEqual(
    detectCommitType('fix: repair database link', 'BREAKING CHANGE: table dropped'),
    {
      isBreaking: true,
      type: 'fix'
    }
  );

  assert.deepEqual(detectCommitType('docs(readme): fix typo'), {
    isBreaking: false,
    type: 'docs'
  });

  assert.deepEqual(detectCommitType('ci: speed up runner'), {
    isBreaking: false,
    type: 'ci'
  });
});

test('calculateNextVersion - calculates semver versions', () => {
  assert.equal(calculateNextVersion('1.0.0', 'patch'), '1.0.1');
  assert.equal(calculateNextVersion('1.0.1', 'minor'), '1.1.0');
  assert.equal(calculateNextVersion('1.1.0', 'major'), '2.0.0');
  assert.equal(calculateNextVersion('2.0.0', 'patch'), '2.0.1');
  assert.equal(calculateNextVersion('1.0.0', 'none'), '1.0.0');
});

test('determineRelease - skips release when only docs/tests changed', () => {
  const result = determineRelease({
    title: 'docs: update readme guide',
    changedFiles: ['README.md', 'docs/architecture.md'],
    currentVersion: '1.0.0'
  });

  assert.equal(result.shouldDeploy, false);
  assert.equal(result.bumpType, 'none');
  assert.equal(result.newVersion, '1.0.0');
  assert.match(result.reason, /Only non-deployable files/);
});

test('determineRelease - bumps minor on new feature in code', () => {
  const result = determineRelease({
    title: 'feat: add markdown pdf export button',
    changedFiles: ['src/App.tsx', 'src/components/Toolbar.tsx'],
    currentVersion: '1.0.0'
  });

  assert.equal(result.shouldDeploy, true);
  assert.equal(result.bumpType, 'minor');
  assert.equal(result.newVersion, '1.1.0');
  assert.equal(result.newTag, 'v1.1.0');
});

test('determineRelease - bumps major on breaking change', () => {
  const result = determineRelease({
    title: 'feat!: overhaul storage API structure',
    changedFiles: ['server/index.js'],
    currentVersion: '1.0.0'
  });

  assert.equal(result.shouldDeploy, true);
  assert.equal(result.bumpType, 'major');
  assert.equal(result.newVersion, '2.0.0');
  assert.equal(result.newTag, 'v2.0.0');
});

test('determineRelease - bumps patch on fix or code update', () => {
  const result = determineRelease({
    title: 'fix: correct syntax highlighting for json',
    changedFiles: ['src/components/CodeBlock.tsx'],
    currentVersion: '1.0.0'
  });

  assert.equal(result.shouldDeploy, true);
  assert.equal(result.bumpType, 'patch');
  assert.equal(result.newVersion, '1.0.1');
  assert.equal(result.newTag, 'v1.0.1');
});

test('determineRelease - respects manual workflow override', () => {
  const resultMinor = determineRelease({
    bumpOverride: 'minor',
    currentVersion: '1.0.0'
  });
  assert.equal(resultMinor.shouldDeploy, true);
  assert.equal(resultMinor.bumpType, 'minor');
  assert.equal(resultMinor.newVersion, '1.1.0');

  const resultSkip = determineRelease({
    bumpOverride: 'skip',
    currentVersion: '1.0.0'
  });
  assert.equal(resultSkip.shouldDeploy, false);
  assert.equal(resultSkip.bumpType, 'none');
});
