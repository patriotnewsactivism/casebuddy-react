import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  items: []
};

const evidenceSlice = createSlice({
  name: 'evidence',
  initialState,
  reducers: {
    addEvidence: {
      reducer(state, action) {
        state.items.push(action.payload);
      },
      prepare(evidence) {
        return { payload: { id: nanoid(), ...evidence } };
      }
    },
    updateEvidence(state, action) {
      const { id, changes } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        Object.assign(item, changes);
      }
    },
    deleteEvidence(state, action) {
      const id = action.payload;
      state.items = state.items.filter(item => item.id !== id);
    },
    addTagToEvidence(state, action) {
      const { id, tag } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.tags = item.tags || [];
        if (!item.tags.includes(tag)) {
          item.tags.push(tag);
        }
      }
    },
    removeTagFromEvidence(state, action) {
      const { id, tag } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item && item.tags) {
        item.tags = item.tags.filter(t => t !== tag);
      }
    }
  }
});

export const { addEvidence, updateEvidence, deleteEvidence, addTagToEvidence, removeTagFromEvidence } = evidenceSlice.actions;

export default evidenceSlice.reducer;
