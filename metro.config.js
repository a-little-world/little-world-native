const { createProxyMiddleware } = require('http-proxy-middleware');

const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const proxyRequests = false;
const frontendPath = path.resolve(__dirname, 'frontend');

module.exports = (() => {
  const config = getSentryExpoConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('./metro-svg-transformer.js'),
    // Remove minification config that was causing issues
  };
  const isCIBuild = process.env.IS_CI_BUILD === 'true';
  if (!isCIBuild) {
    // fixes metro cache errors in local builds, production (built in cloud) should keep the cache
    // Unable to resolve module ./../../../../../46f05506-791f-4df0-a080-6e421c03dd79/build/src/components/blocks/LittleWorldWebLazy.tsx from /private/var/folders/8h/0jk2h57s643fvbdqgf3c4f980000gn/T/eas-build-local-nodejs/f7b072aa-4517-4501-b910-de2d32db5e2f/build/node_modules/expo/dom/entry.js
    config.cacheVersion = new Date().getTime().toString();
  }

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    // Fix React resolution issues
    alias: {
      react: require.resolve('react'),
      'react-native': require.resolve('react-native'),
      // Add path alias support for @/ imports
      '@': path.resolve(__dirname),
    },
    // Add platform-specific resolver to handle DOM components
    resolverMainFields: ['react-native', 'browser', 'main'],
    // Add platform-specific extensions to handle DOM components
    platforms: ['ios', 'android', 'native', 'web'],
    // Ensure project root is properly resolved for DOM components
    projectRoot: __dirname,
    // Remove problematic blockList that was causing issues
  };

  config.watchFolders = [...(config.watchFolders ?? []), frontendPath];
  // Follow pnpm symlinks so the workspace virtual store resolves to one physical file per package.
  config.resolver.unstable_enableSymlinks = true;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Native (ios/android) can't process .css, so stub it out there. The web/DOM
    // bundle (rendered in the DOM-component WebView) CAN — let Expo's built-in CSS
    // transform bundle it so the native app matches the web app's styling.
    if (moduleName.endsWith('.css') && platform !== 'web') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, '_metro_css_stub.js'),
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  };

  // Configure serializer to handle DOM components better
  config.serializer = {
    ...config.serializer,
    // Ensure custom serializer handles path resolution correctly
    customSerializer: config.serializer?.customSerializer,
  };

  if (proxyRequests) {
    const apiProxy = createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    });

    config.server = {
      ...config.server,
      enhanceMiddleware: middleware => {
        return (req, res, next) => {
          if (req.url.startsWith('/api') || req.url.startsWith('/media')) {
            return apiProxy(req, res, next);
          }
          return middleware(req, res, next);
        };
      },
    };
  }

  return config;
})();
