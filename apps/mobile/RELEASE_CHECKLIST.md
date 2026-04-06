# LECIPM mobile (Expo) release checklist

This checklist covers the Expo mobile app in `apps/mobile` for App Store and Google Play release.

## 1. App Configuration

- [x] Production API base URL points to `https://lecipm.com`
- [x] `eas.json` exists with build profiles
- [ ] Confirm app name is final: `LECIPM` (store listing can add subtitle)
- [ ] Confirm iOS bundle ID is final: `com.lecipm.app`
- [ ] Confirm Android package is final: `com.lecipm.app`
- [ ] Confirm app version and build numbers are ready for release

## 2. Store Assets

### Shared

- [ ] App icon, 1024x1024
- [ ] Brand-safe mobile app logo
- [ ] Short app description
- [ ] Full app description
- [ ] Keywords / search terms
- [x] Support email: `dr.m.mashhour@gmail.com`
- [ ] Support URL on `https://lecipm.com`
- [ ] Privacy policy URL on `https://lecipm.com`

### Apple App Store

- [ ] iPhone screenshots
- [ ] Optional iPad screenshots if supporting tablet store presentation
- [ ] App category selected
- [ ] Age rating questionnaire completed
- [ ] App review notes prepared
- [ ] Demo/test account ready if Apple review requests login

### Google Play

- [ ] Phone screenshots
- [ ] Feature graphic
- [ ] App category selected
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] Test track configured

## 3. Legal and Policy Readiness

- [ ] Privacy policy page published on `lecipm.com`
- [ ] Support/contact page published on `lecipm.com`
- [ ] Terms page reviewed for mobile app behavior
- [ ] Push notification disclosures reviewed
- [ ] Any location / tracking / analytics disclosures reviewed

## 4. Functional Release Testing

- [ ] App launches successfully on iPhone
- [ ] App launches successfully on Android
- [ ] Login works against `https://lecipm.com`
- [ ] Session persists after closing and reopening app
- [ ] Logout works correctly
- [ ] Trips / bookings load correctly
- [ ] Booking details load correctly
- [ ] Support chat works
- [ ] Notifications permission prompt works
- [ ] Push registration works in production config
- [ ] Error states are user-friendly when API fails
- [ ] No localhost references remain in mobile behavior

## 5. Expo / Build Steps

- [ ] `eas login`
- [ ] `eas build --platform ios --profile production`
- [ ] `eas build --platform android --profile production`
- [ ] iOS build tested on device or TestFlight
- [ ] Android build tested on device or internal track

## 6. Submission Steps

### Apple

- [ ] App created in App Store Connect
- [ ] Build uploaded
- [ ] Metadata completed
- [ ] Screenshots uploaded
- [ ] Privacy details completed
- [ ] Submitted for review

### Google

- [ ] App created in Google Play Console
- [ ] AAB uploaded
- [ ] Store listing completed
- [ ] Data safety completed
- [ ] Release created
- [ ] Submitted for review / rollout

## 7. Post-Release

- [ ] Verify production login after release
- [ ] Verify push notifications after release
- [ ] Verify crash-free first launch
- [ ] Monitor store review feedback
- [ ] Prepare next patch version if stores request changes

## Useful Commands

```bash
cd apps/mobile
eas login
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --profile production
eas submit --platform android --profile production
```
