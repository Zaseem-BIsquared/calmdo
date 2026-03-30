import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTP } from "./otp/ResendOTP";
import { ResendOTPPasswordReset } from "./password/ResendOTPPasswordReset";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    ResendOTP,
    Password({ reset: ResendOTPPasswordReset }),
  ],
});
