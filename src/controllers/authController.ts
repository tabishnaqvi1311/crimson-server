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

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "15m";
const SESSION_EXPIRES_IN = "7d";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN as string

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


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
        const { role } = req.query;
        if (!role) return res.status(400).json({ message: "role is required" });

        const state = jwt.sign({ role }, JWT_SECRET as string, { expiresIn: "5m" });
        const url = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&scope=openid%20email%20profile%20&response_type=code&state=${state}`;

        return res.status(302).redirect(url);
    },
    callback: async (req: Request, res: Response) => {
        const { code, state } = req.query;

        if (!code || !state) return res.status(400).json({ message: "invalid request" });

        let statePayload = null;
        //verify state to avoid CSRF while also getting role user enteres
        try {
            statePayload = jwt.verify(state as string, JWT_SECRET as string) as { role: string };
        } catch (e) {
            console.log(e);
            return res.status(400).json({ message: "invalid state" });
        }

        const role = statePayload.role;
        if (role !== "TALENT" && role !== "YOUTUBER") return res.status(400).json({ message: "invalid state" });

        const data = {
            code: code as string,
            redirect_uri: GOOGLE_CALLBACK_URL,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            grant_type: "authorization_code",
        }

        //exchange AUTHORIZATION_CODE for ACCESS_TOKEN

        const response = await fetch(GOOGLE_ACCESS_TOKEN_URL as string, {
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

        await prisma.user.upsert({
            where: {
                email: payload.email as string
            },
            update: {
                name: payload.name,
                picture: payload.picture
            },
            create: {
                email: payload.email as string,
                name: payload.name as string,
                picture: payload.picture as string,
                role: role
            }
        })

        const token = jwt.sign({ email: payload.email }, JWT_SECRET as string, { expiresIn: SESSION_EXPIRES_IN});

        // TODO: add dev and prod urls in .env 
        //TODO: handle this on client side by clearng URL
        return res.redirect(`${FRONTEND_ORIGIN}/auth-success#token=${token}`);
    },

    login: async (req: Request, res: Response) => {
        const { email, role } = req.body;
        if (!email) return res.status(400).json({ message: "email is required" });
        if (!role) return res.status(400).json({ message: "role is required" });
        if (role !== "TALENT" && role !== "YOUTUBER") return res.status(400).json({ message: "invalid role" });
        if (!emailRegex.test(email)) return res.status(400).json({ message: "invalid email" });


        try {

            const user = await prisma.user.findUnique({
                where: {
                    email: email
                }
            })
            // if user exists, send magic link
            if (user) {
                if(user.role !== role) return res.status(400).json({ message: "invalid role sent" });
                const token = jwt.sign({ userId: user.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });
                await sendMagicLink(user.email, token);
                console.log("magic link sent");
                return res.status(200).json({ message: "check your email for a magic link" });
            }

            // we dont want to leak if a user exists or not
            // so we also make an account for them if they dont exist
            console.log("user not found, creating...")

            await prisma.$transaction(async (t) => {
                const newUser = await t.user.create({ data: { email, role } });
                const token = jwt.sign({ userId: newUser.id }, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });
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
        // TODO: Use Authorization header with Bearer token
        const { token } = req.query;
        if (!token) return res.status(401).json({ message: "forbidden" });
        let user = null;

        try {
            const payload = jwt.verify(token as string, JWT_SECRET as string) as { userId: string };
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

        // big issue: we are sending the 15m token to the client
        // fix: send a new token with a longer expiry
        const sessionToken = jwt.sign({ userId: user.id }, JWT_SECRET as string, { expiresIn: SESSION_EXPIRES_IN });  

        return res.redirect(`${FRONTEND_ORIGIN}/auth-success#token=${sessionToken}`);
    }
}