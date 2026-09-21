import { combineReducers, configureStore } from "@reduxjs/toolkit";
import theme from "./theme";

const rootReducer = combineReducers({ theme });

export type RootState = ReturnType<typeof rootReducer>;

/**
 * The app's one Redux store. It is made per browser session (see StoreProvider) rather than as a
 * module-level singleton, so nothing leaks between requests on the server.
 */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
