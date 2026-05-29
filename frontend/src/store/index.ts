import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import pricingWizardReducer from './pricingWizardSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    pricingWizard: pricingWizardReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
