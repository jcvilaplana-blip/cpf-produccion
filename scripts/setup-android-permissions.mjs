#!/usr/bin/env node
/**
 * Adds required permissions to AndroidManifest.xml after `npx cap add android`.
 * Run: node scripts/setup-android-permissions.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()
const MANIFEST_PATH = join(ROOT, "android", "app", "src", "main", "AndroidManifest.xml")

if (!existsSync(MANIFEST_PATH)) {
  console.error("AndroidManifest.xml not found. Run `npx cap add android` first.")
  process.exit(1)
}

let manifest = readFileSync(MANIFEST_PATH, "utf-8")

const permissions = [
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />',
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />',
  '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
]

let added = 0
for (const perm of permissions) {
  if (!manifest.includes(perm)) {
    // Insert before the first <application tag
    manifest = manifest.replace(
      '<application',
      `    ${perm}\n    <application`
    )
    added++
  }
}

// Enable cleartext for local dev (http), disable for production
// The Capacitor config already sets cleartext: false

writeFileSync(MANIFEST_PATH, manifest, "utf-8")
console.log(`Android permissions: ${added} added, ${permissions.length - added} already present.`)
console.log("AndroidManifest.xml updated successfully.")
