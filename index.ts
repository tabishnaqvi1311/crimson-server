import express from 'express';
import authRouter from './routes/authRoutes.ts';

const port: number = parseInt(process.env.PORT as string) || 8080;
const app = express();

app.use(express.json());
app.use("/auth", authRouter);

app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
});