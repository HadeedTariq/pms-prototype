import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import { genders } from "@/lib/utils";

const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Must be a valid email address"),
  user_name: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be less than 30 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),

  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
    invalid_type_error: "Gender must be one of male, female, or other",
  }),
});

type RegisterSchema = z.infer<typeof registerSchema>;

const RegisterAccount = ({
  setShowOtp,
}: {
  setShowOtp: (value: boolean) => void;
}) => {
  const [viewPassword, setViewPassword] = useState(false);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      user_name: "",
      password: "",
      gender: "male",
    },
  });

  const { mutate: registerUser, isPending: isRegistering } = useMutation({
    mutationKey: ["register-account"],
    mutationFn: async (values: RegisterSchema) => {
      const { data } = await authApi.post("/register", values);
      return { ...data, email: values.email };
    },
    onSuccess: (data) => {
      toast({
        title: data.message || "Opt send to your email",
        variant: "default",
        duration: 2000,
      });
      form.reset();
      localStorage.setItem(
        "current-email",
        JSON.stringify({
          email: data.email,
        })
      );
      setShowOtp(true);
    },
    onError: (error: ErrResponse) => {
      toast({
        title: error.response?.data?.message || "Registration failed",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const onSubmit = (values: RegisterSchema) => {
    registerUser(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-white">Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="user_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-white">Username</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Choose a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-white">Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {genders.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    placeholder="Create a strong password"
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

        <Button
          type="submit"
          className="w-full"
          variant="app"
          disabled={isRegistering}
        >
          {isRegistering ? "Creating account..." : "Register"}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterAccount;
