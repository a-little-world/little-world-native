import {
  ConfigPlugin,
  withAppBuildGradle,
  withXcodeProject,
} from 'expo/config-plugins';

// The sentry build plugin only uploads the main bundle's source maps, while expo also
// embeds the DOM component (webview) bundles with their maps in the app. This hooks
// webview-sourcemaps.js in right after bundling, before the app is packaged.
// @expo/cli 57 no longer emits these maps, making this a no-op. On upgrade, replace
// it with a CI step: maps from `expo export --source-maps`, the frontend chunk map's debugId
// set to the shipped bundle's (only asset URLs differ), failing if IDs don't match the app.

type Props = { organization: string; project: string };

const SCRIPT = 'plugins/webview-sourcemaps.js';
const XCODE_PHASE = 'Upload webview source maps to Sentry';

const withWebViewSourceMaps: ConfigPlugin<Props> = (
  config,
  { organization, project },
) => {
  config = withAppBuildGradle(config, config => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('withWebViewSourceMaps: app/build.gradle is not Groovy');
    }
    if (config.modResults.contents.includes(SCRIPT)) return config;

    config.modResults.contents += `
// webview source maps: upload to sentry and keep them out of the app
tasks.matching { it.name.startsWith("createBundle") && it.name.endsWith("JsAndAssets") }.configureEach { task ->
    def bundleDir = task.jsBundleDir
    def script = new File(rootDir.parentFile, "${SCRIPT}")
    task.doLast {
        def wwwDir = new File(bundleDir.get().asFile, "www.bundle")
        def process = new ProcessBuilder("node", script.path, wwwDir.path, "${organization}", "${project}").inheritIO().start()
        if (process.waitFor() != 0) {
            throw new GradleException("Uploading webview source maps failed")
        }
    }
}
`;
    return config;
  });

  return withXcodeProject(config, config => {
    const xcodeProject = config.modResults;
    if (
      xcodeProject.pbxItemByComment(XCODE_PHASE, 'PBXShellScriptBuildPhase')
    ) {
      return config;
    }
    // appended, so it runs after "Bundle React Native code and images"
    xcodeProject.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      XCODE_PHASE,
      null,
      {
        shellPath: '/bin/sh',
        // node isn't on PATH in Xcode builds; load NODE_BINARY like the bundle phase does
        shellScript: `set -e
XCODE_ENV_PATH="\${PODFILE_DIR:-$PODS_ROOT/..}/.xcode.env"
[ -f "$XCODE_ENV_PATH" ] && . "$XCODE_ENV_PATH"
[ -f "$XCODE_ENV_PATH.local" ] && . "$XCODE_ENV_PATH.local"
"\${NODE_BINARY:-node}" "$PROJECT_DIR/../${SCRIPT}" "$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/www.bundle" "${organization}" "${project}"`,
      },
    );
    return config;
  });
};

export default withWebViewSourceMaps;
