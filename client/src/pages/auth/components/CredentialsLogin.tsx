import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().min(1, "Email or Phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

const CredentialsLogin = () => {
  const navigate = useNavigate();
  const [viewPassword, setViewPassword] = useState(false);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: loginWithCredentials, isPending: isLoggingIn } = useMutation({
    mutationKey: ["login-credentials"],
    mutationFn: async ({
      email,
      password,
    }: {
      email?: string;
      password: string;
    }) => {
      const payload = { email, password };

      const response = await authApi.post(
        "/authenticate-with-credentials",
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: data.message || "Login successful",
        variant: "default",
        duration: 2000,
      });
      navigate("/onboarding");
    },
    onError: (error: ErrResponse) => {
      toast({
        title: error.response?.data?.message || "Login failed",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const onSubmit = (data: LoginSchema) => {
    const { email, password } = data;

    const emailResult = z.string().email().safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Invalid email format",
        variant: "destructive",
      });
      return;
    }
    loginWithCredentials({ email: email, password });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-white">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-white">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={viewPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setViewPassword(!viewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
                    aria-label={
                      viewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {viewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Link
          className="text-red-500 text-sm underline flex justify-end "
          to={"/authenticate/forgot-password"}
        >
          Forgot Password?
        </Link>

        <Button
          type="submit"
          className="w-full"
          variant="app"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
};

export default CredentialsLogin;
