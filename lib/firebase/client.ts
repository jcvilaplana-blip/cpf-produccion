"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

let recaptchaVerifier: RecaptchaVerifier | null = null

/**
 * Sends an SMS OTP to the given phone number (E.164 format, e.g. +34600000000).
 * containerId must be an empty <div id="..."> already mounted in the DOM -
 * Firebase renders an invisible reCAPTCHA challenge into it.
 */
export async function sendPhoneOtp(phoneNumber: string, containerId: string): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth()

  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" })
  }

  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}

export function resetRecaptcha() {
  recaptchaVerifier?.clear()
  recaptchaVerifier = null
}
