import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { sql } from "./config/db.js";

import userRouters from "./routes/userRoutes.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT;

console.log(PORT);

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(helmet());
app.use(morgan("dev"))

app.use("/api/users", userRouters)

async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("Tạo bảng users thành công!");
  } catch (error) {
    console.error("Lỗi khi tạo bảng users:", error.stack);
  }
}
initDB().then(()=>{
  app.listen(PORT, () => {
    console.log("server has started on port "+ PORT);
});
})