# App Store Deployment Guide (GitHub + Capacitor + Xcode)

This repository is configured as a Capacitor 8 iOS (Swift Package Manager) + PWA production project for **Tic Tac Toe Pro** (`com.codetech.tictactoepro`).

## What Is Included

- `www/`: Production offline-ready web bundle (`index.html`, `privacy.html`, `manifest.webmanifest`, `sw.js`, and generated PNG icons in `www/icons/`) with built-in **Offline Mode**, **Clear Cache**, and **Clear All Data** controls.
- `capacitor.config.json`: Capacitor configuration pointing `webDir` to `www`.
- `ios/App/`: Generated Xcode project (`App.xcodeproj` + `CapApp-SPM`) with `AppIcon.appiconset` (1024x1024 opaque RGB PNG), `Info.plist` (`ITSAppUsesNonExemptEncryption = false`), `PrivacyInfo.xcprivacy` (Apple Privacy Manifest), and Capacitor WKWebView integration.
- `android/app/`: Generated Android Studio project (`versionName 2.1.0`) with synced adaptive launcher icons across all `mipmap-*` densities.
- `.github/workflows/ci.yml`: Automated Node.js build & lint checks on push/PR.
- `.github/workflows/ios-release.yml`: macOS GitHub Actions Xcode build/archive pipeline.

---

## Step 1: Push to GitHub

From your local terminal inside the project directory:

```bash
git status
git add .
git commit -m "chore: prepare App Store ready iOS Capacitor & Xcode release"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

## Step 2: Open & Sync in Xcode on macOS

Xcode requires macOS. On your Mac:

1. Clone your GitHub repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```
2. Install Node dependencies, regenerate icons, and sync web assets into Xcode:
   ```bash
   npm ci
   npm run ios:sync
   ```
3. Open the Xcode project (`ios/App/App.xcodeproj`):
   ```bash
   npx cap open ios
   ```

---

## Step 3: Configure Signing & App Store Connect in Xcode

1. In Xcode, select the **App** project in the left navigator -> **Targets** -> **App** -> **Signing & Capabilities**.
2. Check **Automatically manage signing** and select your **Apple Developer Team**.
3. Verify the **Bundle Identifier** (`com.codetech.tictactoepro`, or update it to your own unique reverse-domain ID in `capacitor.config.json` + Xcode).
4. Under **General -> Identity**, confirm:
   - **Display Name**: `Tic Tac Toe Pro`
   - **Version**: `2.1.0`
   - **Build**: `1` (increment for each upload to App Store Connect)

---

## Step 4: Build & Upload Production Release to App Store Connect

1. In Xcode's top toolbar, set the destination to **Any iOS Device (arm64)**.
2. Select **Product -> Archive** from the menu bar.
3. Once archiving finishes, the **Organizer** window opens automatically.
4. Click **Distribute App** -> **App Store Connect** -> **Upload**.
5. In [App Store Connect](https://appstoreconnect.apple.com):
   - Select your uploaded build for TestFlight or App Store submission.
   - Set **Privacy Policy URL** to your hosted `/privacy.html` URL.
   - Complete the App Privacy questionnaire (**Data Not Collected** — all scores & preferences stay on-device).
   - Submit for App Review.

---

## Optional: Android Studio / Google Play Build

1. Sync web assets into Android:
   ```bash
   npm run android:sync
   ```
2. Open in Android Studio:
   ```bash
   npx cap open android
   ```
3. Use **Build → Generate Signed App Bundle / APK** to produce a release `.aab` for Google Play.

