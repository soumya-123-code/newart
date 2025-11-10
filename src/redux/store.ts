import { configureStore } from '@reduxjs/toolkit';
import reconciliationReducer from './slices/reconciliationSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import uploadReducer from './slices/uploadSlice';
import downloadReducer from './slices/downloadSlice';

export const store = configureStore({
  reducer: {
    reconciliation: reconciliationReducer,
    auth: authReducer,
    ui: uiReducer,
    upload: uploadReducer,
    download: downloadReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/fetchUserData/pending', 'auth/fetchUserData/fulfilled'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;