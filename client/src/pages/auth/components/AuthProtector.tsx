import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/lib/axios";
import LoadingBar from "@/components/LoadingBar";

interface AuthProtectorProps {
  children: React.ReactNode;
}

const AuthProtector = ({ children }: AuthProtectorProps) => {
  const { isPending, data: user } = useQuery({
    queryKey: ["authenticateUser"],
    queryFn: async () => {
      const { data } = await authApi.get("/");
      return data;
    },
    refetchOnMount: false,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isPending) return <LoadingBar />;
  if (user) return <Navigate to="/" />;

  return <>{children}</>;
};

export default AuthProtector;
