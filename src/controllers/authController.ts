import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import prisma from "../utils/db.js";
import jwt from "jsonwebtoken";
import sendMagicLink from "../utils/sendMagicLink.js";
import { Payload } from "../types/Payload.js";
import { ExchangeBody } from "../types/ExchangeBody.js";
import exchangeCode from "../utils/exchangeCode.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

const {
    JWT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    GOOGLE_OAUTH_URL,
} = process.env;

const JWT_EXPIRES_IN = "15m";
const SESSION_EXPIRES_IN = "7d";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN as string;

const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// big todo: use cookies
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in prod
    sameSite:
        process.env.NODE_ENV === "production"
            ? "none"
            : ("lax" as "none" | "lax"), //prevent CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
};

interface AuthController {
    google: (req: Request, res: Response) => any;
    callback: (req: Request, res: Response) => any;
    login: (req: Request, res: Response) => any;
    verify: (req: Request, res: Response) => any;
    logout: (req: Request, res: Response) => any;
    me: (req: RequestWithUser, res: Response) => any;
}

export const authController: AuthController = {
    google: async (req: Request, res: Response) => {
        //go to consent screen
        const { role } = req.query;
        if (!role) return res.status(400).json({ message: "role is required" });

        const state = jwt.sign({ role }, JWT_SECRET as string, {
            expiresIn: "5m",
        });
        const url = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&scope=openid%20email%20profile%20&response_type=code&state=${state}`;

        return res.status(302).redirect(url);
    },
    callback: async (req: Request, res: Response) => {
        // code here is the AUTHORIZATION_CODE
        const { code, state } = req.query;

        if (!code || !state)
            return res.status(400).json({ message: "invalid request" });

        let statePayload = null;
        //verify state to avoid CSRF while also getting role user enteres
        try {
            statePayload = jwt.verify(
                state as string,
                JWT_SECRET as string,
            ) as { role: string };
        } catch (e) {
            console.log(e);
            return res.status(400).json({ message: "invalid state" });
        }

        const role = statePayload.role;
        if (role !== "TALENT" && role !== "YOUTUBER")
            return res.status(400).json({ message: "invalid state" });

        const data: ExchangeBody = {
            code: code as string,
            redirect_uri: GOOGLE_CALLBACK_URL as string,
            client_id: GOOGLE_CLIENT_ID as string,
            client_secret: GOOGLE_CLIENT_SECRET as string,
            grant_type: "authorization_code",
        };

        const accessTokenData = await exchangeCode(data);
        if (!accessTokenData) {
            return res.status(500).json({ message: "failed exchange" });
        }

        const { id_token } = accessTokenData;

        // verify id_token (manual is risky, so i use google-auth-library)

        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload)
            return res.status(400).json({ message: "invalid token payload" });

        const user = await prisma.user.upsert({
            where: {
                email: payload.email as string,
            },
            update: {
                name: payload.name,
                picture: payload.picture,
            },
            create: {
                email: payload.email as string,
                name: payload.name as string,
                picture: payload.picture as string,
                role: role,
            },
            include: {
                youtuberProfile: true,
            },
        });

        const isVerified = user.youtuberProfile !== null; // we can check for role in frontend anyways

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                picture: user.picture,
                isVerified,
            },
            JWT_SECRET as string,
            { expiresIn: SESSION_EXPIRES_IN },
        );

        res.cookie("auth_token", token, COOKIE_OPTIONS);

        return res.redirect(`${FRONTEND_ORIGIN}/auth-success`);
    },

    login: async (req: Request, res: Response) => {
        const { email, role } = req.body;
        if (!email)
            return res.status(400).json({ message: "email is required" });
        if (!role) return res.status(400).json({ message: "role is required" });
        if (role !== "TALENT" && role !== "YOUTUBER")
            return res.status(400).json({ message: "invalid role" });
        if (!emailRegex.test(email))
            return res.status(400).json({ message: "invalid email" });

        try {
            const user = await prisma.user.findUnique({
                where: {
                    email: email,
                },
            });
            // if user exists, send magic link
            if (user) {
                const token = jwt.sign(
                    { userId: user.id },
                    JWT_SECRET as string,
                    { expiresIn: JWT_EXPIRES_IN },
                );
                await sendMagicLink(user.email, token);
                console.log("magic link sent");
                return res
                    .status(200)
                    .json({ message: "check your email for a magic link" });
            }

            // we dont want to leak if a user exists or not
            // so we also make an account for them if they dont exist
            // console.log("user not found, creating...")

            await prisma.$transaction(async (t) => {
                const newUser = await t.user.create({
                    data: {
                        name: email.split("@")[0],
                        email,
                        role,
                    },
                });
                const token = jwt.sign(
                    { userId: newUser.id },
                    JWT_SECRET as string,
                    { expiresIn: JWT_EXPIRES_IN },
                );
                await sendMagicLink(newUser.email, token);
                // console.log("User created and magic link sent");
            });

            return res
                .status(200)
                .json({ message: "check your email to login" });
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
            const payload: Payload = jwt.verify(
                token as string,
                JWT_SECRET as string,
            ) as Payload;
            user = await prisma.user.findUnique({
                where: {
                    id: payload.userId,
                },
                include: {
                    youtuberProfile: true,
                },
            });
            if (!user) return res.status(401).json({ message: "forbidden" });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }

        const isVerified = user.youtuberProfile !== null;

        // big issue: we are sending the 15m token to the client
        // fix: send a new token with a longer expiry
        const sessionToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                picture: user.picture,
                isVerified,
            },
            JWT_SECRET as string,
            { expiresIn: SESSION_EXPIRES_IN },
        );

        res.cookie("auth_token", sessionToken, COOKIE_OPTIONS);

        return res.redirect(`${FRONTEND_ORIGIN}/auth-success`);
    },

    logout: async (req: Request, res: Response) => {
        res.clearCookie("auth_token", {
            ...COOKIE_OPTIONS,
            maxAge: 0,
        });

        return res.status(200).json({ message: "Logged out successfully" });
    },

    me: async (req: RequestWithUser, res: Response) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        return res.status(200).json({
            userId: req.user.userId,
            role: req.user.role,
            picture: req.user.picture,
            isVerified: req.user.isVerified,
        });
    },
};
