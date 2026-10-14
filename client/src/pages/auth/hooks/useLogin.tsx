import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useMutation } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import { loginValidator, LoginValidator } from "../validators/auth.validator";
import { authApi } from "@/lib/axios";

export const useLogin = () => {
  const navigate = useNavigate();
  const form = useForm<LoginValidator>({
    resolver: zodResolver(loginValidator),
  });
  const mutator = useMutation({
    mutationKey: ["logInToAccount"],
    mutationFn: async (user: LoginValidator) => {
      const { data } = await authApi.post("/login", user);
      console.log(data);
    },
    onSuccess: () => {
      form.reset();
      setTimeout(() => {
        navigate("/");
      }, 1200);
    },
    onError: (err: ErrResponse) => {
      console.log(err);
    },
  });

  return { form: { ...form }, mutations: { ...mutator } };
};
