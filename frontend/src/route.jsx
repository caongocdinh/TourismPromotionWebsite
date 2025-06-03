import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import UserLayout from "./components/Layout/UserLayout";
import Homepage from "./components/pages/HomePage";
import EditorPage from "./components/pages/EditorPage";
import PostList from "./components/Common/PostList";
import Post from "./components/Common/Post";
import AdminDashboard from "./components/Admin/AdminDashboard";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Hanbook from "./components/pages/Hanbook";
import ContactPage from "./components/pages/Contact";
import CategoryPage from "./components/pages/CategoryPage";

// Component bảo vệ route cho admin
const ProtectedAdminRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  return user?.role === "admin" ? children : <Navigate to="/" />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { index: true, element: <Homepage /> },
          { path: "editor", element: <EditorPage /> },
          { path: "posts", element: <PostList /> },
          { path: "posts/:id", element: <Post /> },
          {
            path: "admin",
            element: (
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            ),
          },
          { path: "hanbook", element: <Hanbook /> },
          { path: "contact", element: <ContactPage /> },
          {
            path: "explore",
            children: [
              { path: ":category_id", element: <CategoryPage /> }, 
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
