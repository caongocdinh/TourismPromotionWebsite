import { sql } from "../config/db.js";

export const addLocation = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({
      success: false,
      error: "Thiếu tên location",
    });
  }
  try {
    const location = await sql`
      INSERT INTO locations (name)
      VALUES (${name})
      RETURNING id, name, created_at
    `;
    res.status(201).json({
      success: true,
      data: location[0],
    });
  } catch (error) {
    console.error("Lỗi khi thêm location:", error.stack);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const getAllLocations = async (req, res) => {
  try {
    const locations = await sql`
      SELECT id, name, created_at
      FROM locations
    `;
    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách locations:", error.stack);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const getLocationBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const locations = await sql`
      SELECT id, name, created_at
      FROM locations
      WHERE LOWER(name) = ${slug.replace(/-/g, ' ')}
      LIMIT 1
    `;
    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy địa điểm",
      });
    }
    res.status(200).json({
      success: true,
      data: locations[0],
    });
  } catch (error) {
    console.error("Lỗi khi lấy địa điểm theo slug:", error.stack);
    res.status(500).json({ error: "Lỗi server" });
  }
};