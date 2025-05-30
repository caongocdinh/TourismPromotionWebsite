import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthModal from './components/Common/AuthModal';

const App = () => (
  <>
    <AuthModal /> {/* Luôn hiển thị modal ở mọi trang */}
    <Outlet /> {/* Render các route con */}
  </>
);

export default App;