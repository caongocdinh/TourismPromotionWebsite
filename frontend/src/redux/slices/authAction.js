import { createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { dispatch }) => {
    try {
      const res = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }
);

export const googleLoginUser = createAsyncThunk(
  'auth/googleLoginUser',
  async ({ token }, { dispatch }) => {
    try {
      const res = await fetch('http://localhost:5000/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập Google thất bại');
      }
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }
);