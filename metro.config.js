const { createProxyMiddleware } = require("http-proxy-middleware");

const path = require("path");
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const proxyRequests = false;
const isLocalLittleplanet = process.env.EXPO_PUBLIC_LITTLEPLANET_PACKAGED !== "true" && process.env.IS_CI_BUILD !== "true";
const littleplanetLocalPath = path.resolve(__dirname, "frontend");
const littleplanetSourceEntry = path.resolve(__dirname, "frontend/src/index.ts");

module.exports = (() => {
  const config = getSentryExpoConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("./metro-svg-transformer.js"),
    // Remove minification config that was causing issues
  };
  const isCIBuild = process.env.IS_CI_BUILD === "true";
  if (!isCIBuild) {
    // fixes metro cache errors in local builds, production (built in cloud) should keep the cache
    // Unable to resolve module ./../../../../../46f05506-791f-4df0-a080-6e421c03dd79/build/src/components/blocks/LittleWorldWebLazy.tsx from /private/var/folders/8h/0jk2h57s643fvbdqgf3c4f980000gn/T/eas-build-local-nodejs/f7b072aa-4517-4501-b910-de2d32db5e2f/build/node_modules/expo/dom/entry.js
    config.cacheVersion = new Date().getTime().toString();
  }

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
    // Fix React resolution issues
    alias: {
      react: require.resolve("react"),
      "react-native": require.resolve("react-native"),
      // Add path alias support for @/ imports
      "@": path.resolve(__dirname),
      ...(isLocalLittleplanet ? { littleplanet: littleplanetSourceEntry } : {}),
    },
    // Add platform-specific resolver to handle DOM components
    resolverMainFields: ["react-native", "browser", "main"],
    // Add platform-specific extensions to handle DOM components
    platforms: ["ios", "android", "native", "web"],
    // Ensure project root is properly resolved for DOM components
    projectRoot: __dirname,
    // Remove problematic blockList that was causing issues
  };

  if (isLocalLittleplanet) {
    config.watchFolders = [...(config.watchFolders ?? []), littleplanetLocalPath];
    // Follow pnpm symlinks so the workspace virtual store resolves to one physical file per package.
    config.resolver.unstable_enableSymlinks = true;

    config.resolver.resolveRequest = (context, moduleName, platform) => {
      if (moduleName.endsWith(".css")) {
        return { type: "sourceFile", filePath: path.resolve(__dirname, "_metro_css_stub.js") };
      }
      return context.resolveRequest(context, moduleName, platform);
    };
  }

  // Configure serializer to handle DOM components better
  config.serializer = {
    ...config.serializer,
    // Ensure custom serializer handles path resolution correctly
    customSerializer: config.serializer?.customSerializer,
  };

  if (proxyRequests) {
    const apiProxy = createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
    });

    config.server = {
      ...config.server,
      enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
          if (req.url.startsWith("/api") || req.url.startsWith("/media")) {
            return apiProxy(req, res, next);
          }
          return middleware(req, res, next);
        };
      },
    };
  }

  return config;
})();