import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

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

app.get("/", (req, res) =>{
    res.send("Hello from the backend");
})

app.listen(PORT, () => {
    console.log("server has started on port "+ PORT);
});