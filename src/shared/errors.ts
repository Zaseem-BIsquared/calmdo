export const ERRORS = {
  auth: {
    EMAIL_NOT_SENT: "Unable to send email.",
    USER_NOT_CREATED: "Unable to create user.",
    SOMETHING_WENT_WRONG:
      "Something went wrong while trying to authenticate.",
  },
  onboarding: {
    USERNAME_ALREADY_EXISTS: "Username already exists.",
    SOMETHING_WENT_WRONG:
      "Something went wrong while trying to onboard.",
  },
  billing: {
    MISSING_SIGNATURE: "Unable to verify webhook signature.",
    MISSING_ENDPOINT_SECRET: "Unable to verify webhook endpoint.",
    CUSTOMER_NOT_CREATED: "Unable to create customer.",
    SOMETHING_WENT_WRONG:
      "Something went wrong while trying to handle Stripe API.",
  },
  common: {
    UNKNOWN: "Unknown error.",
    ENVS_NOT_INITIALIZED: "Environment variables not initialized.",
    SOMETHING_WENT_WRONG: "Something went wrong.",
  },
  // Plugin errors go here:
  // admin: { ... }
} as const;
