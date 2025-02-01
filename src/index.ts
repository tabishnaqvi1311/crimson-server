import express from 'express';
import authRouter from './routes/authRoutes.js';
import cors from 'cors';
import userRouter from './routes/userRoutes.js';

const port: number = parseInt(process.env.PORT as string) || 8080;
const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
}));

app.use("/auth", authRouter);
app.use("/users", userRouter);

app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
});