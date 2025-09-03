import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/authSlice';
import caseReducer from '../features/caseSlice';
import evidenceReducer from '../features/evidenceSlice';
import witnessReducer from '../features/witnessSlice';
import taskReducer from '../features/taskSlice';
import timelineReducer from '../features/timelineSlice';
import aiReducer from '../features/aiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cases: caseReducer,
    evidence: evidenceReducer,
    witnesses: witnessReducer,
    tasks: taskReducer,
    timeline: timelineReducer,
    ai: aiReducer,
  },
});

export default store;
