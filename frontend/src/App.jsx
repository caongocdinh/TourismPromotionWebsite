import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import Homepage from './components/pages/HomePage';
import UserLayout from './components/Layout/UserLayout';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthModal from './components/Common/AuthModal'; // Import AuthModal
import PostList from './components/Common/PostList';
import Post from './components/Common/Post';

const App = () => {
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID"> {/* Replace with your Google Client ID */}
        <BrowserRouter>
          <AuthModal /> {/* Render AuthModal globally */}
          <Routes>
            {/* User layout */}
            <Route path="/" element={<UserLayout />}>
              <Route index element={<Homepage />} />
              <Route path="posts" element={<PostList/>}/>
<Route path="posts/:id" element={<Post/>}/>
            </Route>
          </Routes>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </Provider>
  );
};

export default App;