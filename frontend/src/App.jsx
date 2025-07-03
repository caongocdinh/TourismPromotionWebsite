import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AuthModal from './components/Common/AuthModal';
import ForgotPasswordModal from './components/Common/ForgotPasswordModal';
import useAuth from './hooks/useAuth';
import Header from './components/Common/Header'; // Thêm lại Header nếu cần

const App = () => {
  const [showForgotModal, setShowForgotModal] = useState(false);

  return (
    <>
      <AuthModal onForgotPassword={() => setShowForgotModal(true)} />
      <ForgotPasswordModal show={showForgotModal} onClose={() => setShowForgotModal(false)} />
      <Outlet /> {/* Render các route con */}
    </>
  );
};

export default App;