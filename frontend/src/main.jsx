// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { GoogleOAuthProvider } from '@react-oauth/google';

import router from './route';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>,
);
