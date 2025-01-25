import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library"
import prisma from "../utils/db.js";
import jwt from 'jsonwebtoken';
import sendMagicLink from "../utils/sendMagicLink.js";


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ACCESS_TOKEN_URL = process.env.GOOGLE_ACCESS_TOKEN_URL;

const JWT_SECRET = "/YtspIchVV6ZzTj7aDhDXQ==";


const client = new OAuth2Client(GOOGLE_CLIENT_ID);

interface AuthController {
    google: (req: Request, res: Response) => any,
    callback: (req: Request, res: Response) => any,
    login: (req: Request, res: Response) => any,
    verify: (req: Request, res: Response) => any,
}


export const authController: AuthController = {
    google: async (req: Request, res: Response) => {
        //go to consent screen
        const url = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&scope=openid%20email%20profile%20&response_type=code&state=login`;
        return res.status(302).redirect(url);
    },
    callback: async (req: Request, res: Response) => {
        console.log("callback");
        if (!GOOGLE_ACCESS_TOKEN_URL) {
            return res.status(400).json({ message: "google access token url not found" });
        }

        const { code } = req.query;
        console.log(code);

        if (!code) {
            return res.status(400).json({ message: "code not found" });
        }

        const data = {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_CALLBACK_URL,
            grant_type: "authorization_code",
        }


        //exchange AUTHORIZATION_CODE for ACCESS_TOKEN

        const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const accessTokenData = await response.json();

        const { id_token } = accessTokenData;

        // verify id_token (manual is risky, so i use google-auth-library)

        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID,
        })

        const payload = ticket.getPayload();
        if (!payload) return res.status(400).json({ message: "invalid token payload" });

        return res.redirect("http://localhost:5173");
    },

    login: async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "email is required" });

        try {

            const user = await prisma.user.findUnique({
                where: {
                    email: email
                }
            })
            // if user exists, send magic link
            if (user) {
                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
                await sendMagicLink(user.email, token);
                console.log("magic link sent");
                return res.status(200).json({ message: "check your email for a magic link" });
            }

            // we dont want to leak if a user exists or not
            // so we also make an account for them if they dont exist
            console.log("user not found, creating...")

            await prisma.$transaction(async (t) => {
                const newUser = await t.user.create({
                    data: { email: email, role: "TALENT" }
                });
                const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "1h" });
                await sendMagicLink(newUser.email, token);
                console.log("User created and magic link sent");
            })

            return res.status(200).json({ message: "check your email to login" });

        } catch (e) {
            // we dont wanna create orphans in db
            // so i rollback user creation if code enters this block
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    },
    // TODO: something something token blacklisting
    verify: async (req: Request, res: Response) => {
        const { token } = req.query;
        if (!token) return res.status(401).json({ message: "forbidden" });
        let user = null;

        try {
            const payload = jwt.verify(token as string, JWT_SECRET) as { userId: string };
            user = await prisma.user.findUnique({
                where: {
                    id: payload.userId
                }
            })
            if (!user) return res.status(401).json({ message: "forbidden" });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }

        return res.status(200).json({ user });
    }
}