import { Navigate, Outlet } from "react-router-dom";

import LoadingBar from "@/components/LoadingBar";
import { useAuthHandler } from "@/hooks/useAuthChecker";

const AuthLayout = () => {
  const { isError, isPending } = useAuthHandler();

  if (isPending) return <LoadingBar />;
  if (isError) return <Navigate to="/" />;

  return <Outlet />;
};

export default AuthLayout;
