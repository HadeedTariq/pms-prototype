import { Loader2 } from "lucide-react";
import HandleOnboarding from "../../components/organization/HandleOnboarding";
import { useGetMyOrganization } from "../../hooks/organization/useOnboarding";
import { Navigate } from "react-router-dom";

const Onboarding = () => {
  const { data, isLoading, isError } = useGetMyOrganization();
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Checking your organization…</p>
        </div>
      </div>
    );
  }

  if (!isError && !isLoading && data) return <Navigate to={"/"} />;
  return (
    <>
      <HandleOnboarding />
    </>
  );
};

export default Onboarding;
