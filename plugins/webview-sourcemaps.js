// Run by the native builds right after bundling (see withWebViewSourceMaps.ts): uploads the
// DOM component (webview) source maps to Sentry, then removes them so they don't ship.
// Usage: node webview-sourcemaps.js <www.bundle dir> <sentry org> <sentry project>
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [wwwDir, org, project] = process.argv.slice(2);

// debug builds don't bundle
if (!fs.existsSync(wwwDir)) process.exit(0);

if (process.env.SENTRY_DISABLE_AUTO_UPLOAD !== 'true') {
  const uploader =
    require.resolve('@sentry/react-native/scripts/expo-upload-sourcemaps.js');
  const { status } = spawnSync(process.execPath, [uploader, wwwDir], {
    // project root: the uploader reads SENTRY_AUTH_TOKEN from .env files there
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: {
      SENTRY_URL: 'https://sentry.io/',
      ...process.env,
      SENTRY_ORG: org,
      SENTRY_PROJECT: project,
    },
  });
  if (status !== 0) process.exit(status ?? 1);
} else {
  for (const file of fs.readdirSync(wwwDir, { recursive: true })) {
    if (!file.endsWith('.map')) continue;
    const { debugId } = JSON.parse(fs.readFileSync(path.join(wwwDir, file)));
    console.log(`Skipping upload: ${file} (debug id ${debugId})`);
  }
}

for (const file of fs.readdirSync(wwwDir, { recursive: true })) {
  if (file.endsWith('.map')) fs.rmSync(path.join(wwwDir, file));
}
