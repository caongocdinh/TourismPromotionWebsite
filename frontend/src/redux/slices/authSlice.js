import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  articles: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.articles = [];
      localStorage.removeItem('token');
    },
    setArticles: (state, action) => {
      state.articles = action.payload;
    },
  },
});

export const { setUser, logout, setArticles } = authSlice.actions; // Xuất các action creators
export default authSlice.reducer; // Xuất reducer mặc định