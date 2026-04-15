const { transform: svgrTransform } = require("@svgr/core");
const resolveConfigDir = require("path-dirname");

/**
 * Metro Babel transformer for React Native
 * Prioritizes @react-native/metro-babel-transformer for RN >= 0.73.0
 */
const getReactNativeTransformer = () => {
  try {
    return require("@react-native/metro-babel-transformer");
  } catch (error) {
    return require("metro-react-native-babel-transformer");
  }
};

/**
 * Expo Babel transformer
 */
const getExpoTransformer = () => {
  try {
    return require("@expo/metro-config/babel-transformer");
  } catch (error) {
    try {
      return require("expo/node_modules/@expo/metro-config/babel-transformer");
    } catch (nestedError) {
      return null;
    }
  }
};

/**
 * Custom Metro transformer for SVG files
 *
 * - SVGs from the frontend ('littleplanet') package are converted to data URIs for <img src="..."> usage
 * - All other SVGs are transformed into React components using SVGR
 * - Non-SVG files are passed through to the default transformer
 */
async function customTransform({ src, filename, options }) {
  const transformer = getExpoTransformer() || getReactNativeTransformer();

  // Only process SVG files - pass everything else through to default transformer
  if (!filename || !filename.endsWith(".svg")) {
    return transformer.transform({ src, filename, options });
  }

  // Check if this SVG is from the frontend ('littleplanet') package
  const isFrontendSvg = filename.includes("littleplanet");
  if (isFrontendSvg) {
    // Convert to data URI for use with <img src="...">
    const svgContent = src;

    // Create a data URI from the SVG content
    // Remove newlines and extra spaces to make it more compact
    const minifiedSvg = svgContent
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/> </g, "><")
      .trim();

    // Encode for use in data URI
    const base64Svg = Buffer.from(minifiedSvg).toString("base64");
    const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

    // Export the data URI as a string for use with <img src={...}>
    return transformer.transform({
      src: `module.exports = ${JSON.stringify(dataUri)};`,
      filename: filename.replace(/\.svg$/, ".js"),
      options,
    });
  }

  // For all other SVGs, use SVGR to create React components
  const svgrConfig = {
    native: true,
    plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
    svgoConfig: {
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: {
              inlineStyles: { onlyMatchedOnce: false },
              removeViewBox: false,
              removeUnknownsAndDefaults: false,
              convertColors: false,
            },
          },
        },
      ],
    },
  };

  const transformedSrc = await svgrTransform(src, svgrConfig, {
    filePath: filename,
  });

  return transformer.transform({
    src: transformedSrc,
    filename,
    options,
  });
}

// Export the transform function directly
module.exports.transform = customTransform;
