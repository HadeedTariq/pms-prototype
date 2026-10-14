import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { onboardingApi } from "@/lib/axios";
import {
  CreateOrganizationInput,
  createOrganizationSchema,
} from "../../validators/organization.validator";

export const useCreateOrganization = () => {
  const navigate = useNavigate();

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      type: "hotel",
      country: "",
      currency: "",
      timezone: "",
      email: "",
      phone: "",
      website: "",
    },
  });

  const mutator = useMutation({
    mutationKey: ["createOrganization"],
    mutationFn: async (payload: CreateOrganizationInput) => {
      // Clean up empty optional fields so backend can handle them as omitted or null
      const formattedPayload = {
        ...payload,
        slug: payload.slug?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        email: payload.email?.trim() || undefined,
        phone: payload.phone?.trim() || undefined,
        website: payload.website?.trim() || undefined,
      };

      const { data } = await onboardingApi.post("/", formattedPayload);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: data?.message || "Organization created successfully",
        variant: "default",
        duration: 2500,
      });
      form.reset();
      setTimeout(() => {
        navigate("/organizations");
      }, 1000);
    },
    onError: (err: any) => {
      toast({
        title: err?.response?.data?.message || "Failed to create organization",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  return { form: { ...form }, mutations: { ...mutator } };
};

export const useGetMyOrganization = () => {
  let queryKey = `get-organization`;
  let url = `/`;
  const result = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await onboardingApi.get(url);
      return data as OnboardingData;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: true,
  });

  return result;
};
