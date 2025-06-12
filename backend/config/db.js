import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

// creates a SQL connection using our env variables
export const sql = neon(
  `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
);
async function testConnection() {
  try {
    const result = await sql`SELECT version()`;
    console.log(
      "Kết nối Neon thành công, phiên bản PostgreSQL:",
      result[0].version
    );
  } catch (error) {
    console.error("Lỗi khi kết nối Neon:", error);
  }
}

testConnection();
//this sql function we expost is used as a tagged template literal, which allows
//us to write sql queries safely
