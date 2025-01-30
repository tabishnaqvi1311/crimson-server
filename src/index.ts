import express from 'express';
import authRouter from './routes/authRoutes.js';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { slowDown } from 'express-slow-down';

const port: number = parseInt(process.env.PORT as string) || 8080;
const app = express();

// TODO: make strict other routes like /login 
const throttler = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 15,
    delayMs: (hits) => hits * 200,
    maxDelayMs: 5000
})

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false
})

app.use(throttler, limiter);

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
}));
app.use("/auth", authRouter);

app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
});