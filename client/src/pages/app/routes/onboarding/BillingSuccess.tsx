import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSubscriptionStatus } from "../../hooks/organization/useOnboarding";

const BillingSuccess = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { data, isLoading, refetch } = useSubscriptionStatus();

  // Webhook may take a second or two. Poll a few times.
  useEffect(() => {
    if (!sessionId) return;
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      refetch();
      if (attempts >= 5) clearInterval(id);
    }, 1500);
    return () => clearInterval(id);
  }, [sessionId, refetch]);

  const isActive =
    data?.subscriptionStatus === "active" ||
    data?.subscriptionStatus === "trialing";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      {isLoading || !isActive ? (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold">
            Confirming your subscription…
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This usually takes a few seconds.
          </p>
        </>
      ) : (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-2xl font-semibold">You're all set!</h1>
          <p className="mt-2 text-muted-foreground">
            Your {data.planKey} plan is now active.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-md bg-primary px-6 py-2 text-primary-foreground"
          >
            Go to dashboard
          </Link>
        </>
      )}
    </div>
  );
};

export default BillingSuccess;
