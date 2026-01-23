# TWA (Trusted Web Activity) Configuration Guide

This document provides instructions for packaging the Jyotish Career PWA as an Android app using Trusted Web Activities (TWA).

## Prerequisites

1. **Android Studio** installed on your development machine
2. **Java Development Kit (JDK)** version 11 or higher
3. **A published PWA** with valid HTTPS and manifest.json

## Step 1: Install Bubblewrap

Bubblewrap is Google's tool for generating TWA projects.

```bash
npm install -g @anthropic/anthropic-sdk
```

## Step 2: Initialize TWA Project

```bash
bubblewrap init --manifest https://your-domain.com/manifest.json
```

## Step 3: Configuration Values

When prompted, use these values:

| Field | Value |
|-------|-------|
| Application ID | `com.jyotishcareer.app` |
| Application Name | `Jyotish Career` |
| Short Name | `Jyotish` |
| Host | `your-published-domain.com` |
| Start URL | `/` |
| Theme Color | `#7c3aed` |
| Background Color | `#f8f7ff` |
| Status Bar Color | `#7c3aed` |
| Splash Screen Color | `#f8f7ff` |
| Icon Path | `./client/public/icons/icon-512x512.png` |
| Maskable Icon | `./client/public/icons/icon-512x512.png` |
| Display Mode | `standalone` |
| Orientation | `portrait` |

## Step 4: Digital Asset Links

Create a `.well-known/assetlinks.json` file in your public directory:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.jyotishcareer.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT_HERE"
    ]
  }
}]
```

To get your SHA256 fingerprint:
```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

## Step 5: Build the APK

```bash
bubblewrap build
```

This generates:
- `app-release-signed.apk` - Signed APK for testing
- `app-release-bundle.aab` - Android App Bundle for Play Store

## Step 6: Play Store Submission

1. Create a Google Play Developer account ($25 one-time fee)
2. Create a new app in the Play Console
3. Upload the `.aab` file
4. Fill in store listing details:
   - Title: Jyotish Career - Vedic Astrology & Career Guide
   - Short description: Discover your cosmic career path
   - Full description: (Use app description from manifest)
   - Category: Lifestyle
   - Content rating: Everyone
5. Add screenshots and feature graphic
6. Submit for review

## Alternative: PWA Builder

You can also use [PWA Builder](https://www.pwabuilder.com/) for a simpler process:

1. Visit https://www.pwabuilder.com/
2. Enter your PWA URL
3. Click "Package for stores"
4. Select "Android"
5. Download the generated package
6. Follow the included instructions

## App Features for Store Listing

### Key Features
- Personalized Vedic birth chart generation
- Career recommendations based on planetary positions
- Vimshottari Dasha timing analysis
- Modern income stream suggestions
- Gemstone and mantra remedies
- Offline support via PWA

### Screenshots Needed
1. Landing page (1080x1920)
2. Dashboard view (1080x1920)
3. Birth chart display (1080x1920)
4. Career recommendations (1080x1920)
5. Timing analysis (1080x1920)

### Feature Graphic
- Size: 1024x500 pixels
- Show app icon with cosmic background
- Include tagline: "Your Cosmic Career Guide"
