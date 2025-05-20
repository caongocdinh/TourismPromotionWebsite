import { sql } from "../config/db.js";
export const getAllUsers = async (req, res) => {
  try {
    const users = await sql`
    SELECT * FROM user
    
    `;
    console.log("Danh sach nguoi dung", users);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Loi khi lay danh sach nguoi dung: ", error);
    res.status(500).json({ error: "Loi server" });
  }
};

export const addUser = async (req, res) => {
    const {name, email, password} = req.body
    if(!name|| !email || !password){
        return res.status(400).json({
            success: false,
            error: "thieu thong tin can thiet"
        })
    }
    try {
        const user = await sql`
        
        Insert into users(name, email, password)
        values (${name}, ${email}, ${password})
        returning id, name, email, created_at
        `
        res.status(201).json(user[0])
    } catch (error) {
        console.error("Loi khi them nguoi dung: ", error);
    res.status(500).json({ error: "Loi server" });
    }
}