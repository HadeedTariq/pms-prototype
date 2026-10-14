import { authApi } from "@/lib/axios";
import { setUser } from "@/reducers/fullAppReducer";
import { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";

export const useAuthChecker = (dispatch: Dispatch<UnknownAction>) => {
  const authChecker = useMutation({
    mutationKey: ["authenticateUser-refresh"],
    mutationFn: async () => {
      const { data } = await authApi.get("/");
      dispatch(setUser(data));
    },
    onError: async () => {
      const { status } = await authApi.post("/refreshAccessToken");
      if (status < 400) {
        const { data } = await authApi.get("/");
        dispatch(setUser(data));
      }
    },
  });
  return authChecker;
};
export const useAuthHandler = () => {
  const dispatch = useDispatch();
  const authChecker = useQuery({
    queryKey: ["authenticateUser"],
    queryFn: async () => {
      const { data } = await authApi.get("/");
      dispatch(setUser(data));
      return data;
    },
    retry: 2,
  });
  return authChecker;
};
