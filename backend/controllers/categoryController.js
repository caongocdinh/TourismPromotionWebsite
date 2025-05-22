import { sql } from "../config/db.js";

export const addCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Tên category không hợp lệ",
    });
  }
  try {
    const category = await sql`
      INSERT INTO categories (name)
      VALUES (${name.trim()})
      RETURNING id, name, created_at
    `;
    res.status(201).json({
      success: true,
      data: category[0],
    });
  } catch (error) {
    if (error.code === "23505") { // Lỗi UNIQUE violation trong PostgreSQL
      return res.status(400).json({
        success: false,
        error: "Category đã tồn tại",
      });
    }
    console.error("Lỗi khi thêm category:", error.stack);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await sql`
      SELECT id, name, created_at
      FROM categories
    `;
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách categories:", error.stack);
    res.status(500).json({ error: "Lỗi server" });
  }
};