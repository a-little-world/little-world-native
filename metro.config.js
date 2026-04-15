const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const proxyRequests = false;

module.exports = (() => {
  const config = getSentryExpoConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("./metro-svg-transformer"),
  };

  const isCIBuild = process.env.IS_CI_BUILD === "true";
  if (!isCIBuild) {
    // fixes metro cache errors in local builds, production (built in cloud) should keep the cache
    // Unable to resolve module ./../../../../../46f05506-791f-4df0-a080-6e421c03dd79/build/src/components/blocks/LittleWorldWebLazy.tsx from /private/var/folders/8h/0jk2h57s643fvbdqgf3c4f980000gn/T/eas-build-local-nodejs/f7b072aa-4517-4501-b910-de2d32db5e2f/build/node_modules/expo/dom/entry.js
    config.cacheVersion = new Date().getTime().toString();
  }

  config.resolver = {
    ...resolver,
    // Keep SVG in sourceExts (transformed by our custom transformer)
    // and filter out from assetExts (not treated as static assets)
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
    // Fix React resolution issues
    alias: {
      react: require.resolve("react"),
      "react-native": require.resolve("react-native"),
      // Add path alias support for @/ imports
      "@": path.resolve(__dirname),
    },
    // Add platform-specific resolver to handle DOM components
    resolverMainFields: ["react-native", "browser", "main"],
    // Add platform-specific extensions to handle DOM components
    platforms: ["ios", "android", "native", "web"],
    // Ensure project root is properly resolved for DOM components
    projectRoot: __dirname,
    // Remove problematic blockList that was causing issues
  };

  // Serializer hook to fix <img src> usage for images from the littleplanet package
  // Metro's default asset loader exports images as: module.exports = { uri: "..." }
  // This is designed for React Native's <Image source={require(...)} /> API.
  // However, in the WebView DOM component, we need to use standard web <img src="...">
  // This hook transforms the export from an object with a uri property to just the
  // string URL, so that `import img from './image.png'` gives us a usable string
  // for <img src={img}> instead of an object.
  config.serializer = {
    ...config.serializer,
    experimentalSerializerHook: (graph) => {
      for (const module of graph.dependencies.values()) {
        if (
          module.path &&
          /\.(webp|png|jpg|jpeg|gif)$/i.test(module.path) &&
          (module.path.includes("littleplanet") ||
            module.path.includes("node_modules/.pnpm/littleplanet"))
        ) {
          const code = module.output[0]?.data?.code;
          if (code) {
            // Match Metro's default asset export format: module.exports = { uri: "..." }
            const assetMatch = code.match(
              /module\.exports\s*=\s*\{\s*uri:\s*"([^"]+)"[^}]*\}/,
            );

            if (assetMatch) {
              const uri = assetMatch[1];
              // Replace with a simple string export so <img src={require(...)}> works
              module.output[0].data.code = code.replace(
                /module\.exports\s*=\s*\{[^}]+\}/,
                `module.exports = ${JSON.stringify(uri)};`,
              );
              module.output[0].data.map = null;
            }
          }
        }
      }
      return graph;
    },
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
