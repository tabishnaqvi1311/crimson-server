// TODO: add zod for validation

import express from "express";
import authRouter from "./routes/authRoutes.js";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import verificationRouter from "./routes/verificationRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import chalk from "chalk";
import applicationRouter from "./routes/applicationRoutes.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const port: number = parseInt(process.env.PORT as string) || 8080;

if (!process.env.FRONTEND_ORIGIN) {
    throw new Error("FRONTEND_ORIGIN not defined");
}

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }),
);

app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const statusColor =
            res.statusCode >= 500
                ? chalk.redBright
                : res.statusCode >= 400
                  ? chalk.yellowBright
                  : res.statusCode >= 300
                    ? chalk.cyanBright
                    : chalk.greenBright;
        console.log(
            `${req.method} ${req.originalUrl} → ${statusColor(res.statusCode)} in (${duration}ms)`,
        );
    });

    next();
});

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/v", verificationRouter);
app.use("/job", jobRouter);
app.use("/application", applicationRouter);

app.listen(port, () => {
    console.log(`server running on ${process.env.SERVER_ORIGIN}`);
});
