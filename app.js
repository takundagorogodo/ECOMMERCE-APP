import express from "express";
import {config} from "dotenv";
import {connectDB} from "./config/db.js"
import mainRouter from "./routes/mainRouter.js";

config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended:true}));

app.use("/api",mainRouter);


const PORT = process.env.PORT || 5000;

export default app