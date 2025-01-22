import express from 'express';
import authRouter from './routes/authRoutes.js';
import cors from 'cors';
const port = parseInt(process.env.PORT) || 8080;
const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
}));
app.use("/auth", authRouter);
app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
});
