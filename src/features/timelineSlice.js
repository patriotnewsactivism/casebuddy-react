import { createSlice, nanoid } from '@reduxjs/toolkit';

// Initial state for timeline events
const initialState = {
  events: []
};

// Slice for managing timeline events
const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    // Add a new event with a generated ID
    addEvent: {
      reducer(state, action) {
        state.events.push(action.payload);
      },
      prepare(event) {
        return { payload: { id: nanoid(), ...event } };
      }
    },
    // Update an existing event by ID
    updateEvent(state, action) {
      const { id, changes } = action.payload;
      const existing = state.events.find(e => e.id === id);
      if (existing) {
        Object.assign(existing, changes);
      }
    },
    // Delete an event by ID
    deleteEvent(state, action) {
      const id = action.payload;
      state.events = state.events.filter(e => e.id !== id);
    }
  }
});

// Export actions and reducer
export const { addEvent, updateEvent, deleteEvent } = timelineSlice.actions;
export default timelineSlice.reducer;
