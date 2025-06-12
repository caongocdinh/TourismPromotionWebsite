import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthModal from './components/Common/AuthModal';
import useAuth from './hooks/useAuth';
import Header from './components/Common/Header'; // Thêm lại Header nếu cần

const App = () => {
  // const { user } = useAuth(); // Đặt trong thân hàm

  return (
    <>
      <AuthModal /> {/* Luôn hiển thị modal ở mọi trang */}
      <Outlet /> {/* Render các route con */}
    </>
  );
};

export default App;