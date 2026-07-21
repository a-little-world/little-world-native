const path = require('path');
const { transform: svgrTransform } = require('@svgr/core');

const FRONTEND_SRC_ABS = path.resolve(__dirname, 'frontend/src') + path.sep;
const FRONTEND_SRC_REL = 'frontend' + path.sep + 'src' + path.sep;

const getReactNativeTransformer = () => {
  try {
    return require('@react-native/metro-babel-transformer');
  } catch (_) {
    return require('metro-react-native-babel-transformer');
  }
};

const getExpoTransformer = () => {
  try {
    return require('@expo/metro-config/babel-transformer');
  } catch (_) {
    try {
      return require('expo/node_modules/@expo/metro-config/babel-transformer');
    } catch (__) {
      return null;
    }
  }
};

const debug = process.env.SVG_TRANSFORM_DEBUG === '1';

async function customTransform({ src, filename, options }) {
  const transformer = getExpoTransformer() || getReactNativeTransformer();

  if (!filename || !filename.endsWith('.svg')) {
    return transformer.transform({ src, filename, options });
  }

  // Frontend SVGs are consumed via <img src={url}> — emit a data URI string.
  // Native SVGs are consumed via <Svg /> components — use SVGR.
  const isFrontendSvg =
    filename.startsWith(FRONTEND_SRC_ABS) ||
    filename.startsWith(FRONTEND_SRC_REL);

  if (debug) {
    // eslint-disable-next-line no-console
    console.warn(
      `[svg-transformer] ${isFrontendSvg ? 'DATA-URI' : 'SVGR  '} ${filename}`,
    );
  }

  if (isFrontendSvg) {
    const minified = src
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .trim();
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(minified).toString(
      'base64',
    )}`;
    return transformer.transform({
      src: `module.exports = ${JSON.stringify(dataUri)};`,
      filename: filename.replace(/\.svg$/, '.js'),
      options,
    });
  }

  const transformedSrc = await svgrTransform(
    src,
    {
      native: true,
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
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
    },
    { filePath: filename },
  );

  return transformer.transform({
    src: transformedSrc,
    filename,
    options,
  });
}

module.exports.transform = customTransform;
