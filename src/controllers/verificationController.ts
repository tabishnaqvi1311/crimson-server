import { Response } from "express";
import { OAuth2Client } from "google-auth-library";
import prisma from "../utils/db.js";
import { RequestWithUser } from "../types/RequestWithUser.js";
import verifyPayload from "../utils/verifyPayload.js";
import { ExchangeBody } from "../types/ExchangeBody.js";
import exchangeCode from "../utils/exchangeCode.js";
import getYoutubeData from "../utils/getYoutubeData.js";

interface VerificationController {
    verifyYoutuber: (req: RequestWithUser, res: Response) => any;
    callback: (req: RequestWithUser, res: Response) => any;
}

const {
    JWT_SECRET,
    VERIFICATION_GOOGLE_CLIENT_ID,
    VERIFICATION_GOOGLE_CLIENT_SECRET,
    VERIFICATION_GOOGLE_CALLBACK_URL,
    GOOGLE_OAUTH_URL,
    FRONTEND_ORIGIN,
} = process.env;


const client = new OAuth2Client(VERIFICATION_GOOGLE_CLIENT_ID);


export const verificationController: VerificationController = {
    verifyYoutuber: async (req: RequestWithUser, res: Response) => {
        const { token } = req.query;

        if (!token || typeof token !== "string") return res.status(400).json({ message: "token is required" });

        const url = `${GOOGLE_OAUTH_URL}?client_id=${VERIFICATION_GOOGLE_CLIENT_ID}&redirect_uri=${VERIFICATION_GOOGLE_CALLBACK_URL}&scope=openid%20email%20profile%20https://www.googleapis.com/auth/youtube.readonly&response_type=code&state=${token}`;

        res.status(302).redirect(url);
    },

    callback: async (req: RequestWithUser, res: Response) => {
        const { code, state } = req.query;

        if (!code || !state) return res.status(400).json({ message: "invalid request" });

        const statePayload = verifyPayload(state as string, JWT_SECRET as string);

        if (!statePayload || !statePayload.role || !statePayload.userId) {
            return res.status(400).json({ message: "invalid state" });
        }

        const { role, userId } = statePayload;

        if (role !== "YOUTUBER") return res.status(400).json({ message: "only youtubers can verify" });

        const data: ExchangeBody = {
            code: code as string,
            client_id: VERIFICATION_GOOGLE_CLIENT_ID as string,
            client_secret: VERIFICATION_GOOGLE_CLIENT_SECRET as string,
            redirect_uri: VERIFICATION_GOOGLE_CALLBACK_URL as string,
            grant_type: "authorization_code"
        }

        const accessTokenData = await exchangeCode(data);
        if (!accessTokenData) {
            return res.status(500).json({ message: "failed exchange" });
        }

        const { id_token, access_token } = accessTokenData;

        // verify id_token
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: VERIFICATION_GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        if (!payload) return res.status(302).redirect(`${FRONTEND_ORIGIN}/profile#failed`);

        const emailInPayload = payload.email;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                youtuberProfile: true,
            }
        });

        if (!user) return res.status(302).redirect(`${FRONTEND_ORIGIN}/profile#failed`);

        if (user.youtuberProfile){
            return res.status(302).redirect(`${FRONTEND_ORIGIN}/profile#success`);
        } 

        if (user.email !== emailInPayload) {
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    secondaryEmail: emailInPayload
                }
            })
        }

        const youtubeData = await getYoutubeData(access_token);
        if (!youtubeData || !youtubeData.items || youtubeData.items.length === 0) {
            return res.status(500).json({ message: "internal server error" });
        }

        // extrct what we need
        const { snippet, statistics } = youtubeData.items[0];
        const { title, description, customUrl, publishedAt } = snippet;
        const { subscriberCount, viewCount, videoCount } = statistics;

        const publishedAtDate = new Date(publishedAt);

        await prisma.youtuberProfile.create({
            data: {
                channelName: title,
                about: description,
                youtubeUsername: customUrl,
                youtuberSince: publishedAtDate,
                subscribers: parseInt(subscriberCount),
                views: parseInt(viewCount),
                videos: parseInt(videoCount),
                user: {
                    connect: {
                        id: userId
                    }
                }
            }
        });

        return res.status(302).redirect(`${FRONTEND_ORIGIN}/profile#success`);
    }
}