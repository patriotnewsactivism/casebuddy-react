import { createSlice, nanoid } from '@reduxjs/toolkit';

// Initial state for witnesses
const initialState = {
  witnesses: []
};

// Slice for managing witnesses
const witnessSlice = createSlice({
  name: 'witness',
  initialState,
  reducers: {
    // Add a new witness with a generated ID
    addWitness: {
      reducer(state, action) {
        state.witnesses.push(action.payload);
      },
      prepare(witness) {
        return { payload: { id: nanoid(), ...witness } };
      }
    },
    // Update an existing witness by ID
    updateWitness(state, action) {
      const { id, changes } = action.payload;
      const existing = state.witnesses.find(w => w.id === id);
      if (existing) {
        Object.assign(existing, changes);
      }
    },
    // Delete a witness by ID
    deleteWitness(state, action) {
      const id = action.payload;
      state.witnesses = state.witnesses.filter(w => w.id !== id);
    }
  }
});

// Export actions and reducer
export const { addWitness, updateWitness, deleteWitness } = witnessSlice.actions;
export default witnessSlice.reducer;
