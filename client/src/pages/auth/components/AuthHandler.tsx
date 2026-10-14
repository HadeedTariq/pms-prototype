import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import CredentialsLogin from "./CredentialsLogin";
import OAuthHandler from "./OAuthHandler";
import RegisterAccount from "./RegisterAccount";
import { OtpHandler } from "./OtpHandler";

export function AuthHandler() {
  const [showOtp, setShowOtp] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    const storageData = JSON.parse(
      localStorage.getItem("current-email") as string
    );
    if (storageData && storageData.email) {
      setShowOtp(true);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br flex items-center justify-center p-4 sm:p-6  dark:bg-black">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-8 sm:p-10 rounded-2xl shadow-2xl border border-green-200/50 dark:bg-gray-800/90 dark:border-green-700/50 dark:shadow-green-900/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {showOtp ? (
          <OtpHandler setShowOtp={(val: boolean) => setShowOtp(val)} />
        ) : showRegistration ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                Welcome To Accoswap
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Sign up to continue
              </p>
              <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mt-3 rounded-full"></div>
            </div>
            <RegisterAccount setShowOtp={(val: boolean) => setShowOtp(val)} />
            <OAuthHandler />
            <div className="text-center text-sm mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <span className="text-gray-600 dark:text-gray-300">
                Already have an account?{" "}
              </span>
              <Button
                type="button"
                onClick={() => setShowRegistration(false)}
                variant="link"
                className="p-0 h-auto font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline-offset-4 hover:underline"
              >
                Sign in here
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                Welcome Back!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in to continue
              </p>
              <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mt-3 rounded-full"></div>
            </div>

            <CredentialsLogin />

            <OAuthHandler />

            <div className="text-center text-sm mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <span className="text-gray-600 dark:text-gray-300">
                Don't have an account?{" "}
              </span>
              <Button
                type="button"
                onClick={() => setShowRegistration(true)}
                variant="link"
                className="p-0 h-auto font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline-offset-4 hover:underline"
              >
                Create one now
              </Button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-green-200 dark:border-green-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
