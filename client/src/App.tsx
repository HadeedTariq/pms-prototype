import { Route, Routes } from "react-router-dom";

import LoadingBar from "./components/LoadingBar";

import { useDispatch } from "react-redux";

import { useEffect } from "react";

import { useAuthChecker } from "./hooks/useAuthChecker";
import { useFullApp } from "./store/hooks/useFullApp";
import HomePage from "./pages/app/routes/HomePage";
import Layout from "./pages/app/components/Layout";
import Authenticate from "./pages/auth/routes/Authenticate";
import AuthProtector from "./pages/auth/components/AuthProtector";
import ForgetPassword from "./pages/auth/routes/ForgetPassword";
import ResetPassword from "./pages/auth/routes/ResetPassword";
import Onboarding from "./pages/app/routes/onboarding/Onboarding";
import AuthLayout from "./pages/app/components/AuthLayout";

function App() {
  const { user } = useFullApp();

  const dispatch = useDispatch();
  const { isPending, mutate: authUser } = useAuthChecker(dispatch);

  useEffect(() => {
    if (!user) {
      authUser();
    }
  }, [user]);

  if (isPending) return <LoadingBar />;
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
      </Route>
      {/*  protected routes  */}
      <Route path="/" element={<AuthLayout />}>
        <Route path="onboarding" element={<Onboarding />} />
      </Route>

      <Route
        path="/authenticate"
        element={
          <AuthProtector>
            <Layout />
          </AuthProtector>
        }
      >
        <Route index element={<Authenticate />} />
        <Route path="forgot-password" element={<ForgetPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>
    </Routes>
  );
}

export default App;
