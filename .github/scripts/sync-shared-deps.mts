// Shared runtime deps = native's pnpm.overrides keys. Pinned exactly to the version
// frontend resolved in frontend/pnpm-lock.yaml, in both the override and native's dep entry.
// --check: fail on drift. --fix: write frontend's versions into package.json.
import { readFileSync, writeFileSync } from 'node:fs';

type Deps = Record<string, string>;
type PackageJson = {
  dependencies?: Deps;
  devDependencies?: Deps;
  pnpm: { overrides: Deps };
};
type RenovateConfig = {
  packageRules: { description?: string; matchPackageNames?: string[] }[];
};

const fix = process.argv.includes('--fix');
function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8'));
}
const native = readJson<PackageJson>('package.json');
const renovate = readJson<RenovateConfig>('renovate.json');
const frontendLock = readFileSync('frontend/pnpm-lock.yaml', 'utf8');

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const frontendVersion = (name: string) =>
  frontendLock.match(
    new RegExp(
      `^ {6}${escapeRegExp(name)}:\\n {8}specifier: .*\\n {8}version: ([^(\\s]+)`,
      'm',
    ),
  )?.[1];

const shared = Object.keys(native.pnpm.overrides);
const errors: string[] = [];

for (const name of shared) {
  const want = frontendVersion(name);
  if (!want) {
    errors.push(
      `${name} is in native pnpm.overrides but not a frontend dependency`,
    );
    continue;
  }
  const targets: [string, Deps][] = [['pnpm.overrides', native.pnpm.overrides]];
  for (const field of ['dependencies', 'devDependencies'] as const) {
    const deps = native[field];
    if (deps?.[name]) targets.push([field, deps]);
  }
  for (const [label, deps] of targets) {
    if (deps[name] === want) continue;
    if (fix) deps[name] = want;
    else
      errors.push(
        `${name}: native ${label} has ${deps[name]}, frontend resolved ${want}`,
      );
  }
}

const rule = renovate.packageRules.find(r =>
  r.description?.startsWith('Shared with frontend'),
);
const ruleNames = [...(rule?.matchPackageNames ?? [])].sort().join();
if (ruleNames !== [...shared].sort().join()) {
  errors.push(
    `renovate.json "Shared with frontend" rule must list exactly: ${shared.join(', ')}`,
  );
}

if (fix) writeFileSync('package.json', JSON.stringify(native, null, 2) + '\n');
for (const e of errors) console.error(`::error::${e}`);
if (errors.length) {
  console.error(
    'Fix: node .github/scripts/sync-shared-deps.mts --fix && pnpm install --lockfile-only',
  );
  process.exit(1);
}
