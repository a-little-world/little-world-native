const path = require('path');
const { createRequire } = require('module');
const { fileURLToPath } = require('url');

const upstream = require(
  require.resolve(
    '@expo/metro-config/build/transform-worker/transform-worker',
    {
      paths: [path.dirname(require.resolve('expo/package.json'))],
    },
  ),
);

const frontendRequire = createRequire(
  path.resolve(__dirname, 'frontend/package.json'),
);
const stylesDir = path.resolve(__dirname, 'frontend/livekit/packages/styles');
const entry = path.join(stylesDir, 'scss/index.scss');
const injector = path.resolve(__dirname, 'livekit-styles.ts');

// Expo's sass support can't follow @use or apply a scoped postcss config, so every
// livekit scss file compiles the whole entry and injects it into one shared <style>.
// Newest compile wins, so a stale cached module can't override a fresh edit.
async function compileStyles() {
  const { css, loadedUrls } = frontendRequire('sass').compile(entry, {
    silenceDeprecations: ['import'],
  });
  const { plugins } = require(path.join(stylesDir, 'postcss.config.js'));
  const result = await frontendRequire('postcss')(plugins).process(css, {
    from: entry,
  });
  const files = loadedUrls
    .filter(url => url.protocol === 'file:')
    .map(url => fileURLToPath(url));
  return { css: result.css, files };
}

module.exports.transform = async (
  config,
  projectRoot,
  filename,
  data,
  options,
) => {
  const file = path.resolve(projectRoot, filename);
  if (
    options.platform !== 'web' ||
    !file.startsWith(stylesDir) ||
    !file.endsWith('.scss')
  ) {
    return upstream.transform(config, projectRoot, filename, data, options);
  }

  const { css, files } = await compileStyles();
  // graph edges so editing a partial triggers a reload
  const partials =
    file === entry
      ? files
          .filter(f => f !== entry)
          .map(f => `require(${JSON.stringify(f)});`)
      : [];
  const code = `${partials.join('\n')}
require(${JSON.stringify(injector)}).injectLivekitStyles(${JSON.stringify(css)}, ${Date.now()});`;
  return upstream.transform(
    config,
    projectRoot,
    `${filename}.js`,
    Buffer.from(code),
    options,
  );
};
