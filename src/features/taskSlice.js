import { createSlice, nanoid } from '@reduxjs/toolkit';

// Initial state for tasks
const initialState = {
  tasks: []
};

// Slice for managing tasks
const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    // Add a new task with a generated ID
    addTask: {
      reducer(state, action) {
        state.tasks.push(action.payload);
      },
      prepare(task) {
        return { payload: { id: nanoid(), ...task } };
      }
    },
    // Update an existing task by ID
    updateTask(state, action) {
      const { id, changes } = action.payload;
      const existing = state.tasks.find(t => t.id === id);
      if (existing) {
        Object.assign(existing, changes);
      }
    },
    // Delete a task by ID
    deleteTask(state, action) {
      const id = action.payload;
      state.tasks = state.tasks.filter(t => t.id !== id);
    },
    // Set the status of a task by ID
    setTaskStatus(state, action) {
      const { id, status } = action.payload;
      const existing = state.tasks.find(t => t.id === id);
      if (existing) {
        existing.status = status;
      }
    }
  }
});

// Export actions and reducer
export const { addTask, updateTask, deleteTask, setTaskStatus } = taskSlice.actions;
export default taskSlice.reducer;
