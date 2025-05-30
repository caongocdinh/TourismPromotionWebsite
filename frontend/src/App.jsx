// src/App.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthModal from './components/Common/AuthModal';

const App = () => (
  <>
    <AuthModal />   {/* Luôn hiện modal ở mọi trang */}
    <Outlet />      {/* Nơi render các route con */}
  </>
);

export default App;
