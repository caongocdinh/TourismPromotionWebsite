import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";

const AdminDataContext = createContext();

export const AdminDataProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, postsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/posts", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersData = Array.isArray(usersRes.data.data) ? usersRes.data.data : [];
        const postsData = Array.isArray(postsRes.data.data)
          ? postsRes.data.data.sort((a, b) => b.id - a.id)
          : [];

        const postsWithComments = await Promise.all(
          postsData.map(async (post) => {
            const commentRes = await axios.get(
              `http://localhost:5000/api/comments/post/${post.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return { ...post, commentCount: commentRes.data.data.length };
          })
        );

        setUsers(usersData);
        setPosts(postsWithComments);
      } catch (error) {
        toast.error("Lỗi khi tải dữ liệu");
        setUsers([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  return (
    <AdminDataContext.Provider value={{ users, setUsers, posts, setPosts, loading }}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => useContext(AdminDataContext);