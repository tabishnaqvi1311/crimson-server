import express from 'express';

const port: number = parseInt(process.env.PORT as string) || 8080;
const app = express();

app.listen(port, () => {
    console.log(`server running on http://localhost:${port}`);
});