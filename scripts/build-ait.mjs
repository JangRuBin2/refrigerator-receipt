#!/usr/bin/env node
/**
 * Build .ait bundle for Apps-in-Toss deployment.
 *
 * granite build가 pluginHooks 에러로 불안정하므로,
 * 직접 .ait (zip) 파일을 생성하는 스크립트.
 *
 * .ait 구조:
 *   app.json                    - 앱 메타데이터
 *   bundle.ios.{ver}.js(.map)   - RN 래퍼 (기존 .ait에서 재사용)
 *   bundle.android.{ver}.js(.map) - RN 래퍼 (기존 .ait에서 재사용)
 *   web/                        - Next.js static export (out/ 디렉토리)
 *
 * Usage:
 *   node scripts/build-ait.mjs            # production
 *   AIT_DEBUG=true node scripts/build-ait.mjs  # debug mode
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'out');
const AIT_FILE = resolve(ROOT, 'acorn.ait');
const STAGING_DIR = resolve(ROOT, '.ait-staging');
const EXISTING_AIT = existsSync(AIT_FILE) ? AIT_FILE : null;

// ─────────────────────────────────────────────
// Step 1: Next.js build + root html fix
// ─────────────────────────────────────────────
console.log('');
console.log('=== Step 1/4: Next.js build ===');
try {
  execSync('pnpm build', { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.error('Next.js build failed');
  process.exit(1);
}

if (!existsSync(resolve(OUT_DIR, 'index.html'))) {
  console.error('ERROR: out/index.html not found. Build may have failed.');
  process.exit(1);
}

// ─────────────────────────────────────────────
// Step 2: Prepare staging directory
// ─────────────────────────────────────────────
console.log('');
console.log('=== Step 2/4: Prepare staging ===');

if (existsSync(STAGING_DIR)) {
  rmSync(STAGING_DIR, { recursive: true });
}
mkdirSync(STAGING_DIR, { recursive: true });

// ─────────────────────────────────────────────
// Step 3: Extract RN bundles from existing .ait or generate app.json
// ─────────────────────────────────────────────
console.log('');
console.log('=== Step 3/4: Prepare bundles ===');

let appJson;

if (EXISTING_AIT) {
  console.log(`Extracting RN bundles from existing ${AIT_FILE}...`);

  // Extract non-web files from existing .ait
  try {
    execSync(
      `unzip -o "${EXISTING_AIT}" -d "${STAGING_DIR}" "app.json" "bundle.*"`,
      { stdio: 'pipe' }
    );
    console.log('Extracted RN bundles from existing .ait');
  } catch {
    console.warn('Warning: Could not extract bundles from existing .ait');
  }

  // Read and update app.json
  const appJsonPath = resolve(STAGING_DIR, 'app.json');
  if (existsSync(appJsonPath)) {
    appJson = JSON.parse(readFileSync(appJsonPath, 'utf-8'));
  }
}

if (!appJson) {
  console.log('Creating new app.json...');
  appJson = {
    appName: 'acorn',
    permissions: [],
    _metadata: {
      runtimeVersion: '0.72.6',
      bundleFiles: [],
      deploymentId: randomUUID(),
      packageJson: {},
    },
  };
}

// Update deploymentId and package dependencies
appJson._metadata.deploymentId = randomUUID();

try {
  const pkgJson = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
  const cleanDeps = (deps) =>
    Object.fromEntries(
      Object.entries(deps || {}).map(([k, v]) => [k, v.replace(/^[\^~]/, '')])
    );
  appJson._metadata.packageJson = {
    dependencies: cleanDeps(pkgJson.dependencies),
    devDependencies: cleanDeps(pkgJson.devDependencies),
  };
} catch {
  console.warn('Warning: Could not read package.json for metadata');
}

writeFileSync(resolve(STAGING_DIR, 'app.json'), JSON.stringify(appJson), 'utf-8');
console.log(`New deploymentId: ${appJson._metadata.deploymentId}`);

// ─────────────────────────────────────────────
// Step 4: Copy web build + create .ait zip
// ─────────────────────────────────────────────
console.log('');
console.log('=== Step 4/4: Create .ait ===');

// Copy out/ → staging/web/
const webDir = resolve(STAGING_DIR, 'web');
cpSync(OUT_DIR, webDir, { recursive: true });
console.log(`Copied out/ → web/ (staging)`);

// Remove old .ait
if (existsSync(AIT_FILE)) {
  rmSync(AIT_FILE);
}

// Create zip
try {
  execSync(`cd "${STAGING_DIR}" && zip -r "${AIT_FILE}" . -x ".*"`, {
    stdio: 'pipe',
  });
} catch (err) {
  console.error('Failed to create .ait zip');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

// Cleanup staging
rmSync(STAGING_DIR, { recursive: true });

// Report
const stats = readFileSync(AIT_FILE);
const sizeMB = (stats.length / (1024 * 1024)).toFixed(2);
console.log('');
console.log(`✅ acorn.ait created (${sizeMB} MB)`);
console.log(`   deploymentId: ${appJson._metadata.deploymentId}`);
console.log('');
console.log('Next: Upload to Apps-in-Toss Partner Console');
console.log('  or: npx ait deploy');
