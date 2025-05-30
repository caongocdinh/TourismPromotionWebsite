// src/AppRouter.jsx
import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import UserLayout from './components/Layout/UserLayout';
import Homepage from './components/pages/HomePage';
import EditorPage from './components/pages/EditorPage';
import PostList from './components/Common/PostList';
import Post from './components/Common/Post';

const router = createBrowserRouter([
  {
    path: '/',          // gốc
    element: <App />,   // chứa AuthModal + Outlet
    children: [
      {
        element: <UserLayout />, // layout người dùng
        children: [
          { index: true, element: <Homepage /> },
          { path: 'editor', element: <EditorPage /> },
          { path: 'posts', element: <PostList /> },
          { path: 'posts/:id', element: <Post /> },
        ],
      },
    ],
  },
]);

export default router;
