import { sql } from "../config/db.js";

export const addTouristPlace = async (req, res) => {
  const { name, description, location_id, longitude, latitude } = req.body;
  if (!name || !location_id) {
    return res.status(400).json({
      success: false,
      error: "Thiếu thông tin cần thiết",
    });
  }
  try {
    const touristPlace = await sql`
      INSERT INTO tourist_places (name, description, location_id, longitude, latitude)
      VALUES (${name}, ${description}, ${location_id}, ${longitude}, ${latitude})
      RETURNING id, name, description, location_id, longitude, latitude, created_at
    `;
    res.status(201).json({
      success: true,
      data: touristPlace[0],
    });
  } catch (error) {
    console.error("Lỗi khi thêm tourist place:", error.stack);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const getAllTouristPlaces = async (req, res) => {
  try {
    const touristPlaces = await sql`
      SELECT tp.id, tp.name, tp.description, tp.location_id, l.name AS location_name, 
             tp.longitude, tp.latitude, tp.created_at
      FROM tourist_places tp
      JOIN locations l ON tp.location_id = l.id
    `;
    res.status(200).json({
      success: true,
      data: touristPlaces,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tourist places:", error.stack);
    res.status(500).json({ error: "Lỗi server" });
  }
};