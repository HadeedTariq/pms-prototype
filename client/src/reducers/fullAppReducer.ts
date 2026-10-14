import { createSlice } from "@reduxjs/toolkit";

export type FullAppState = {
  user: User | null;
};

const initialState: FullAppState = {
  user: null,
};

const fullAppReducer = createSlice({
  name: "fullAppReducer",
  initialState,
  reducers: {
    setUser: (state, { payload }: { payload: User }) => {
      state.user = payload;
    },
  },
});

export const { setUser } = fullAppReducer.actions;
export default fullAppReducer.reducer;
