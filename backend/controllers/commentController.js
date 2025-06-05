import { sql } from "../config/db.js";

// Thêm bình luận
export const addComment = async (req, res) => {
  const { post_id, content } = req.body;
  const user_id = req.user.id;

  if (!post_id || !content) {
    return res.status(400).json({
      success: false,
      error: "Thiếu post_id hoặc nội dung bình luận",
    });
  }

  try {
    // Kiểm tra xem bài viết có tồn tại không
    const postExists = await sql`
      SELECT id FROM posts WHERE id = ${post_id}
    `;
    if (!postExists.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bài viết",
      });
    }

    // Thêm bình luận
    const comment = await sql`
      INSERT INTO comments (post_id, user_id, content)
      VALUES (${post_id}, ${user_id}, ${content})
      RETURNING id, post_id, user_id, content, created_at
    `;

    // Lấy tên người dùng để trả về
    const user = await sql`
      SELECT name FROM users WHERE id = ${user_id}
    `;

    res.status(201).json({
      success: true,
      data: { ...comment[0], user_name: user[0].name },
      message: "Đã thêm bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi thêm bình luận:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server nội bộ",
    });
  }
};

// Lấy danh sách bình luận của một bài viết
export const getCommentsByPost = async (req, res) => {
  const { post_id } = req.params;

  try {
    // Kiểm tra xem bài viết có tồn tại không
    const postExists = await sql`
      SELECT id FROM posts WHERE id = ${post_id}
    `;
    if (!postExists.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bài viết",
      });
    }

    // Lấy danh sách bình luận
    const comments = await sql`
      SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.name as user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ${post_id}
      ORDER BY c.created_at DESC
    `;

    res.status(200).json({
      success: true,
      data: comments,
      message: "Lấy danh sách bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bình luận:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server nội bộ",
    });
  }
};

// Xóa bình luận
export const deleteComment = async (req, res) => {
  const { comment_id } = req.params;
  const user_id = req.user.id;
  const user_role = req.user.role;

  try {
    // Kiểm tra xem bình luận có tồn tại không
    const commentExists = await sql`
      SELECT id, user_id FROM comments WHERE id = ${comment_id}
    `;
    if (!commentExists.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bình luận",
      });
    }

    // Kiểm tra quyền xóa (chỉ chủ bình luận hoặc admin có thể xóa)
    if (commentExists[0].user_id !== user_id && user_role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền xóa bình luận này",
      });
    }

    // Xóa bình luận
    await sql`
      DELETE FROM comments WHERE id = ${comment_id}
    `;

    res.status(200).json({
      success: true,
      message: "Đã xóa bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa bình luận:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server nội bộ",
    });
  }
};

// Sửa bình luận
export const updateComment = async (req, res) => {
  const { comment_id } = req.params;
  const { content } = req.body;
  const user_id = req.user.id;
  const user_role = req.user.role;

  if (!content) {
    return res.status(400).json({
      success: false,
      error: "Nội dung bình luận không được để trống",
    });
  }

  try {
    // Kiểm tra xem bình luận có tồn tại không
    const commentExists = await sql`
      SELECT id, user_id FROM comments WHERE id = ${comment_id}
    `;
    if (!commentExists.length) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy bình luận",
      });
    }

    // Kiểm tra quyền sửa (chỉ chủ bình luận hoặc admin có thể sửa)
    if (commentExists[0].user_id !== user_id && user_role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền sửa bình luận này",
      });
    }

    // Cập nhật bình luận
    const updatedComment = await sql`
      UPDATE comments
      SET content = ${content}, updated_at = NOW()
      WHERE id = ${comment_id}
      RETURNING id, post_id, user_id, content, created_at, updated_at
    `;

    // Lấy tên người dùng để trả về
    const user = await sql`
      SELECT name FROM users WHERE id = ${user_id}
    `;

    res.status(200).json({
      success: true,
      data: { ...updatedComment[0], user_name: user[0].name },
      message: "Đã sửa bình luận thành công",
    });
  } catch (error) {
    console.error("Lỗi khi sửa bình luận:", error.stack);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : "Lỗi server nội bộ",
    });
  }
};