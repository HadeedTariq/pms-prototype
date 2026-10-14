import fullAppReducer, { FullAppState } from "@/reducers/fullAppReducer";

import { configureStore } from "@reduxjs/toolkit";

export interface StoreState {
  fullAppReducer: FullAppState;
}

export const store = configureStore({
  reducer: {
    fullAppReducer: fullAppReducer,
  },
});
