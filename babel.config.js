// Required for zustand persistence storage. Transforms the import.meta from zustand middlewares into one that metro can understand
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
