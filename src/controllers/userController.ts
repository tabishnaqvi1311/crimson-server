import { Request, Response } from "express";
import prisma from "../utils/db.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

interface UserController {
    getUsersByRole: (req: RequestWithUser, res: Response) => any;
    getYoutuberVerifedStatus: (req: RequestWithUser, res: Response) => any;
    getUserById: (req: Request, res: Response) => any;
}

export const userController: UserController = {

    getUserById: async(req: RequestWithUser, res: Response) => {
        const id = req.params.id;
        
        try{
            const user = await prisma.user.findUnique({
                where: {
                    id: id
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    picture: true,
                }
            })
            if(!user) return res.status(404).json({ message: 'user not found' });
            return res.status(200).json({ user });
        } catch(e) {
            console.log(e);
            return res.status(500).json({ message: 'internal server error' });
        }
    },

    getYoutuberVerifedStatus: async(req: RequestWithUser, res: Response) => {
        const id = req.userId;

        try{
            const user = await prisma.user.findUnique({
                where: {
                    id: id
                },
                select: {
                    youtuberProfile: true
                }
            })
            if(!user) return res.status(404).json({ message: 'user not found' });
            const isVerified: boolean = user.youtuberProfile !== null;
            return res.status(200).json({ isVerified });
        } catch(e) {
            console.log(e);
            return res.status(500).json({ message: 'internal server error' });
        }
    },

    getUsersByRole: async (req: Request, res: Response) => {
        const { role } = req.params;
        if (!role) return res.status(400).json({ message: 'role is required' });
        if (role !== "TALENT" && role !== "YOUTUBER") return res.status(400).json({ message: "invalid role" });

        try {
            const users = await prisma.user.findMany({
                where: {
                    role: role
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    picture: true,
                },
                take: 10
            })
            return res.status(200).json({ users });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'internal server error' });
        }
    }
}