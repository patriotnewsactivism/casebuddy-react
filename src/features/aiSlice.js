import { createSlice } from '@reduxjs/toolkit';

// Initial state for AI results and status
const initialState = {
  analysis: null,
  patternRecognition: null,
  chronology: [],
  strategySimulation: null,
  trialOutcome: null,
  citationSuggestions: [],
  status: 'idle',
  error: null
};

// Slice for managing AI outputs and state
const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    // Set analysis result
    setAnalysis(state, action) {
      state.analysis = action.payload;
    },
    // Set pattern recognition result
    setPatternRecognition(state, action) {
      state.patternRecognition = action.payload;
    },
    // Set chronology list
    setChronology(state, action) {
      state.chronology = action.payload;
    },
    // Set strategy simulation result
    setStrategySimulation(state, action) {
      state.strategySimulation = action.payload;
    },
    // Set trial outcome prediction
    setTrialOutcome(state, action) {
      state.trialOutcome = action.payload;
    },
    // Set citation suggestions array
    setCitationSuggestions(state, action) {
      state.citationSuggestions = action.payload;
    },
    // Set status of AI operations
    setStatus(state, action) {
      state.status = action.payload;
    },
    // Set error message
    setError(state, action) {
      state.error = action.payload;
    }
  }
});

// Export actions and reducer
export const {
  setAnalysis,
  setPatternRecognition,
  setChronology,
  setStrategySimulation,
  setTrialOutcome,
  setCitationSuggestions,
  setStatus,
  setError
} = aiSlice.actions;

export default aiSlice.reducer;
