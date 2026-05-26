import Razorpay from 'razorpay';
import Stripe from 'stripe';
import Setting from '../models/Setting.js';
import { env } from '../config/env.js';
import { razorpay as envRazorpay } from '../config/razorpay.js';
import { stripe as envStripe } from '../config/stripe.js';

let settingsCache = null;
let settingsCacheAt = 0;
const CACHE_MS = 30_000;

async function getSettings() {
  if (settingsCache && Date.now() - settingsCacheAt < CACHE_MS) return settingsCache;
  settingsCache = await Setting.findOne().lean();
  settingsCacheAt = Date.now();
  return settingsCache;
}

export function clearPaymentSettingsCache() {
  settingsCache = null;
}

export async function resolveRazorpay() {
  if (envRazorpay) return envRazorpay;
  const s = await getSettings();
  const keyId = env.RAZORPAY_KEY_ID || s?.payment?.razorpayKeyId;
  const keySecret = env.RAZORPAY_KEY_SECRET || s?.payment?.razorpaySecret;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function resolveStripe() {
  if (envStripe) return envStripe;
  const s = await getSettings();
  const secret = env.STRIPE_SECRET_KEY || s?.payment?.stripeSecret;
  if (!secret) return null;
  return new Stripe(secret);
}

export async function getRazorpayKeyId() {
  const s = await getSettings();
  return env.RAZORPAY_KEY_ID || s?.payment?.razorpayKeyId || null;
}

export async function getRazorpaySecret() {
  const s = await getSettings();
  return env.RAZORPAY_KEY_SECRET || s?.payment?.razorpaySecret || null;
}

export async function getStripePublishableKey() {
  const s = await getSettings();
  return s?.payment?.stripePublishableKey || null;
}

export async function getPaymentSettings() {
  const s = await getSettings();
  return {
    currency: s?.payment?.currency || 'INR',
    taxPercentage: s?.payment?.taxPercentage ?? 18,
    mode: s?.payment?.mode || 'Test',
  };
}
