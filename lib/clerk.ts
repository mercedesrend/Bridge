export const CLERK_SIGN_IN_URL = "/sign-in";
export const CLERK_SIGN_UP_URL = "/sign-up";

export function hasClerkPublishableKey() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function isClerkConfigured() {
  return hasClerkPublishableKey() && Boolean(process.env.CLERK_SECRET_KEY);
}
