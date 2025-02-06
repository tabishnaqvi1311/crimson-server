// TODO: add zod for validation

import express from 'express';
import authRouter from './routes/authRoutes.js';
import cors from 'cors';
import userRouter from './routes/userRoutes.js';
import verificationRouter from './routes/verificationRoutes.js';
import jobRouter from './routes/jobRoutes.js';

const port: number = parseInt(process.env.PORT as string) || 8080;
const app = express();


app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/v", verificationRouter);
app.use("/job", jobRouter);

app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
});