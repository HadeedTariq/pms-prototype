import { zodResolver } from "@hookform/resolvers/zod";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  registerValidator,
  RegisterValidator,
} from "../validators/auth.validator";
import { authApi } from "@/lib/axios";

export const useRegisterForm = () => {
  const form = useForm<RegisterValidator>({
    resolver: zodResolver(registerValidator),
  });
  const mutator = useMutation({
    mutationKey: ["verification"],
    mutationFn: async (user: RegisterValidator) => {
      await authApi.post("/verification", user);
    },
    onSuccess: () => {
      form.reset();
    },
    onError: (err) => {
      console.log(err);
    },
  });

  return { form: { ...form }, mutations: { ...mutator } };
};
