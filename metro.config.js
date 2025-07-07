const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Configure SVG transformer
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
  // Enable Fast Refresh for better development experience
  unstable_allowRequireContext: true,
};

// Development-specific optimizations
if (process.env.NODE_ENV === 'development') {
  defaultConfig.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  };
}

defaultConfig.resolver = {
  ...defaultConfig.resolver,
  assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
  extraNodeModules: {
    react: path.resolve(__dirname, "node_modules/react"),
    "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    "styled-components": path.resolve(
      __dirname,
      "node_modules/styled-components"
    ),
    "react-native-svg": path.resolve(
      __dirname,
      "node_modules/react-native-svg"
    ),
    "expo-linear-gradient": path.resolve(
      __dirname,
      "node_modules/expo-linear-gradient"
    ),
  },
};

// Log module resolution
defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react") {
    // Force React to always resolve from test app's node_modules
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "node_modules/react/index.js"),
    };
  }

  // Force styled-components to always resolve from test app's node_modules
  if (moduleName === "styled-components") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/styled-components/index.js"
      ),
    };
  }

  // Handle styled-components/native subpath
  if (moduleName === "styled-components/native") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/styled-components/native/dist/styled-components.native.cjs.js"
      ),
    };
  }

  if (moduleName === "react-native-svg") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/react-native-svg/lib/commonjs/index.js"
      ),
    };
  }

  // Add special handling for expo-linear-gradient
  if (moduleName === "expo-linear-gradient") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/expo-linear-gradient/build/LinearGradient.js"
      ),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = defaultConfig;


