import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  cases: [],
  selectedCaseId: null,
};

const caseSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    addCase: (state, action) => {
      const newCase = {
        id: nanoid(),
        ...action.payload,
      };
      state.cases.push(newCase);
    },
    selectCase: (state, action) => {
      state.selectedCaseId = action.payload;
    },
    updateCase: (state, action) => {
      const { id, updates } = action.payload;
      const existing = state.cases.find((c) => c.id === id);
      if (existing) {
        Object.assign(existing, updates);
      }
    },
    deleteCase: (state, action) => {
      state.cases = state.cases.filter((c) => c.id !== action.payload);
      if (state.selectedCaseId === action.payload) {
        state.selectedCaseId = null;
      }
    },
  },
});

export const { addCase, selectCase, updateCase, deleteCase } = caseSlice.actions;

export default caseSlice.reducer;
