const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const proxyRequests = false;

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
    // Remove minification config that was causing issues
  };

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
    // Fix React resolution issues
    alias: {
      'react': require.resolve('react'),
      'react-native': require.resolve('react-native'),
    },
    // Add platform-specific resolver to handle DOM components
    resolverMainFields: ['react-native', 'browser', 'main'],
    // Add platform-specific extensions to handle DOM components
    platforms: ['ios', 'android', 'native', 'web'],
    // Remove problematic blockList that was causing issues
  };

  // Remove experimental serializer that was causing issues
  // config.serializer = { ... };

  if (proxyRequests) {
    const apiProxy = createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true
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