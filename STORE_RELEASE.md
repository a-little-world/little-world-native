# Store release

Steps in the store portals after [`production-release.yml`](.github/workflows/production-release.yml) has finished (see [Releases](README.md#production)). The workflow only uploads the builds. Nothing reaches users until it's released here.

Release notes for both stores: the version's section in [`CHANGELOG.md`](CHANGELOG.md) / the GitHub release, rewritten for users, in English and German.

## Apple App Store

[App Store Connect](https://appstoreconnect.apple.com) -> **Apps** -> Little World.

1. Wait until the build is processed: it shows up under **TestFlight** (Apple also sends an email). Export compliance is answered automatically (`ITSAppUsesNonExemptEncryption: false` in [`app.config.ts`](app.config.ts)).
2. **Distribution** -> **+** next to **iOS App** -> enter the version `X.Y.Z` (must match the GitHub release).
3. **What's New in This Version**: add the release notes for every localization.
4. **Build** -> **Add Build** -> select the build of this version.
5. Update screenshots, description, etc. only if they changed.
6. **Version Release**: choose manual or automatic release. Optionally enable **Phased Release for Automatic Updates** (rolls out over 7 days).
7. **Add for Review** -> **Submit to App Review**.
8. After approval (status **Pending Developer Release**, manual release only): **Release This Version**.

## Google Play Store

[Play Console](https://play.google.com/console) -> Little World.

1. **Test and release** -> **Testing** -> **Internal testing** -> **Releases**: the new release (version `X.Y.Z`) is already there, uploaded by the workflow.
2. **Promote release** -> select the target track.
3. **Release notes**: add the release notes for every language.
4. Optional (production track): set a staged rollout percentage, e.g. 20%.
5. **Next** -> check errors and warnings -> **Save** -> **Send changes for review** (in **Publishing overview** if managed publishing is on).
6. After approval, if managed publishing is on: **Publishing overview** -> **Publish changes**.
7. Staged rollout: once Sentry looks fine, **Releases** -> **Manage rollout** -> **Update rollout** to increase the percentage, up to 100%. **Halt rollout** stops it if needed.
