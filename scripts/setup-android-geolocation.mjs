#!/usr/bin/env node
/**
 * Patches the Android project to enable geolocation in the WebView.
 * When using server.url (remote URL), the WebView must be explicitly configured
 * to allow geolocation permissions via onGeolocationPermissionsShowPrompt.
 * 
 * Run AFTER: npx cap add android
 *       AND: node scripts/setup-android-permissions.mjs
 * 
 * Usage: node scripts/setup-android-geolocation.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()

// 1. Patch MainActivity.java to auto-grant geolocation to our domain
const MAIN_ACTIVITY_PATH = join(ROOT, "android", "app", "src", "main", "java", "com", "camareroporfavor", "app", "MainActivity.java")

if (!existsSync(MAIN_ACTIVITY_PATH)) {
  console.error("MainActivity.java not found at:", MAIN_ACTIVITY_PATH)
  console.error("Make sure you ran `npx cap add android` first.")
  process.exit(1)
}

const mainActivity = `package com.camareroporfavor.app;

import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();

        // Get the WebView and configure geolocation
        WebView webView = getBridge().getWebView();
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setGeolocationEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                // Auto-grant geolocation for our domain
                if (origin.contains("camareroporfavor.com")) {
                    callback.invoke(origin, true, true);
                } else {
                    callback.invoke(origin, false, false);
                }
            }
        });
    }
}
`

writeFileSync(MAIN_ACTIVITY_PATH, mainActivity, "utf-8")
console.log("MainActivity.java patched with geolocation support.")

// 2. Make sure AndroidManifest.xml has the required permissions
const MANIFEST_PATH = join(ROOT, "android", "app", "src", "main", "AndroidManifest.xml")

if (existsSync(MANIFEST_PATH)) {
  let manifest = readFileSync(MANIFEST_PATH, "utf-8")

  const permissions = [
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
  ]

  let added = 0
  for (const perm of permissions) {
    if (!manifest.includes(perm)) {
      manifest = manifest.replace('<application', `    ${perm}\n    <application`)
      added++
    }
  }

  if (added > 0) {
    writeFileSync(MANIFEST_PATH, manifest, "utf-8")
    console.log(`AndroidManifest.xml: ${added} geolocation permissions added.`)
  } else {
    console.log("AndroidManifest.xml: geolocation permissions already present.")
  }
}

console.log("")
console.log("DONE! Now rebuild the APK:")
console.log("  npx cap copy android")
console.log("  npx cap sync android")
console.log("  Then in Android Studio: Build > Generate Signed APK")
