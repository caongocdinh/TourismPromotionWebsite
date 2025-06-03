import { createSlice } from '@reduxjs/toolkit';

const userFromStorage = JSON.parse(localStorage.getItem('user'));

const initialState = {
  user: userFromStorage || null,
  token: localStorage.getItem('token'),
  articles: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
    initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.articles = [];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    setArticles: (state, action) => {
      state.articles = action.payload;
    },
  },
});


export const { setUser, logout, setArticles } = authSlice.actions; // Xuất các action creators
export default authSlice.reducer; // Xuất reducer mặc định