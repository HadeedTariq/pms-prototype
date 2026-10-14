import { authApi } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useGetSocialPlatformsListingClientProfileDetails = (
  id: string
) => {
  let queryKey = `get-user-profile-${id}`;
  let url = `/details/${id}`;
  const result = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await authApi.get(url);
      return data as User;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: true,
  });

  return result;
};
