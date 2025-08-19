const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const proxyRequests = false;

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
  };

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
  };

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