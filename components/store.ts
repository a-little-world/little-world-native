import { configureStore } from '@reduxjs/toolkit';

import userDataReducer from './userData';

const store = configureStore({
  reducer: {
    userData: userDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
