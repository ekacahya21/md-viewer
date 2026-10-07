## Summary

<!-- Briefly describe what this PR accomplishes and why it is needed. -->
<!-- Link related issues if applicable, e.g. "Closes #12" or "Fixes #45" -->

## PR Title & SemVer Release Impact

This repository enforces automated Semantic Versioning and automated deployment upon merge to `main`. Please ensure your PR title follows [Conventional Commits](https://www.conventionalcommits.org/):

- [ ] **Major (`X.0.0`)**: `feat!:` or `fix!:` or contains `BREAKING CHANGE:` — Breaking change or incompatible API update
- [ ] **Minor (`1.X.0`)**: `feat:` — New feature or backwards-compatible capability
- [ ] **Patch (`1.0.X`)**: `fix:`, `perf:`, or `refactor:` — Bug fix, performance tweak, or internal refactoring
- [ ] **Skip Release**: `docs:`, `test:`, `ci:`, `chore:`, or `style:` — Changes touching only documentation, CI workflows, or test suites

## Breaking Changes

<!-- If this introduces breaking changes, describe what changed, what will break, and migration instructions. -->
- [ ] No breaking changes introduced
- [ ] Yes, breaking change (details provided below):
  <!-- BREAKING CHANGE: <explanation> -->

## Verification Checklist

Please verify that all quality gates pass locally before submitting:

- [ ] `npm test` — All unit and integration tests pass
- [ ] `npm run lint` — Code adheres to project linting rules (oxlint)
- [ ] `npx tsc --noEmit` — Type checking passes without errors
- [ ] `npm run build` — Production bundle compiles successfully
- [ ] Manual browser testing performed (if changes affect the UI/UX)

## Screenshots or Demos (if applicable)

<!-- Add before/after screenshots or short screen recordings for visual changes -->
