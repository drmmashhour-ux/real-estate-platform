# Mobile Asset Placeholders

Add the production mobile store assets here before final release.

Recommended files:

- `icon.png`
  App icon source for Expo / stores.
  Recommended: 1024x1024 PNG.

- `adaptive-icon.png`
  Android adaptive icon foreground asset.

- `splash.png`
  Launch / splash image.

- `notification-icon.png`
  Small monochrome notification icon for Android.

Suggested next step:

Once these files are ready, wire them into `app.config.ts` with Expo `icon`, `android.adaptiveIcon`, and `splash` fields.
