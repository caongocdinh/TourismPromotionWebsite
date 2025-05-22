import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showProfile: false,
  showArticles: false,
  showAuth: false, // New state for auth modal visibility
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowProfile: (state, action) => {
      state.showProfile = action.payload;
    },
    setShowArticles: (state, action) => {
      state.showArticles = action.payload;
    },
    setShowAuth: (state, action) => { // New reducer for auth modal
      state.showAuth = action.payload;
    },
  },
});

export const { setShowProfile, setShowArticles, setShowAuth } = uiSlice.actions; // Export the new action creator
export default uiSlice.reducer; // Export the reducer