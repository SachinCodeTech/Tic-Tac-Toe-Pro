# App Store & Play Store Deployment Guide (GitHub + Capacitor + Xcode / Android Studio)

**Publisher:** CodeTech App Store  
**Contact:** codetech.appstore@gmail.com  
**Bundle ID / Package:** `com.codetech.tictactoepro` · **Version:** `2.1.0` · **Age Rating:** All Ages (4+ / Everyone)

---

## Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: full native mobile UI, CodeTech App Store info, legal notes, iOS & Android builds"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

## Step 2: Deploy Production Build to Apple App Store (macOS + Xcode)

1. On your Mac, clone the repo and sync Capacitor:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   npm ci
   npm run ios:sync
   npx cap open ios
   ```
2. In Xcode (`ios/App/App.xcodeproj`), select **App** -> **Signing & Capabilities** -> check **Automatically manage signing** -> pick your **Apple Developer Team**.
3. Set destination to **Any iOS Device (arm64)** and click **Product -> Archive**.
4. In Xcode Organizer, choose **Distribute App -> App Store Connect -> Upload**.
5. In App Store Connect:
   - Set **Support / Contact Email** to `codetech.appstore@gmail.com`.
   - Set **Privacy Policy URL** to your hosted `/privacy.html`.
   - Set **Age Rating** to **4+ (All Ages)** and **App Privacy** to **Data Not Collected**.

---

## Step 3: Deploy Production Build to Google Play (Optional Android Release)

1. Sync and open in Android Studio:
   ```bash
   npm run android:sync
   npx cap open android
   ```
2. Use **Build -> Generate Signed Bundle / APK -> Android App Bundle (.aab)** to publish to Google Play Console.
