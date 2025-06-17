const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Add watchFolders to the default config
defaultConfig.watchFolders = [
  path.resolve(__dirname, "../little-world-design-system/packages/core"),
  path.resolve(__dirname, "../little-world-design-system/packages/native"),
];

// Configure SVG transformer
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo")
};

defaultConfig.resolver = {
  ...defaultConfig.resolver,
  assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
  extraNodeModules: {
    "@a-little-world/little-world-design-system-core": path.resolve(
      __dirname,
      "../little-world-design-system/packages/core"
    ),
    "@a-little-world/little-world-design-system-native": path.resolve(
      __dirname,
      "../little-world-design-system/packages/native"
    ),
    react: path.resolve(__dirname, "node_modules/react"),
    "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    "styled-components": path.resolve(
      __dirname,
      "node_modules/styled-components"
    ),
    "react-native-svg": path.resolve(__dirname, "node_modules/react-native-svg"),
    "expo-linear-gradient": path.resolve(
      __dirname,
      "node_modules/expo-linear-gradient"
    ),
  },
};

// Log module resolution
defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName.includes("@a-little-world")) {
    // Force React to always resolve from test app's node_modules
    if (moduleName === "react") {
      return {
        type: "sourceFile",
        filePath: path.resolve(__dirname, "node_modules/react/index.js"),
      };
    }
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
      filePath: path.resolve(__dirname, "node_modules/react-native-svg/lib/commonjs/index.js"),
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


