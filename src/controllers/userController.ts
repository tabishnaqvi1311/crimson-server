import { Request, Response } from "express";
import prisma from "../utils/db.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

interface UserController {
    getUsersByRole: (req: RequestWithUser, res: Response) => any;
    getYoutuberVerifedStatus: (req: RequestWithUser, res: Response) => any;
    getUserById: (req: Request, res: Response) => any;
    getCurrentProfile: (req: RequestWithUser, res: Response) => any;
    getYoutuberProfileById: (req: RequestWithUser, res: Response) => any;
    getTalentProfileById: (req: RequestWithUser, res: Response) => any;
    deleteUser: (req: RequestWithUser, res: Response) => any
}

export const userController: UserController = {

    getUserById: async (req: RequestWithUser, res: Response) => {
        const id = req.params.id;

        try {
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
            if (!user) return res.status(404).json({ message: 'user not found' });
            return res.status(200).json({ user });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'internal server error' });
        }
    },

    getCurrentProfile: async (req: RequestWithUser, res: Response) => {
        const id = req.userId;
        let user = null;

        try {
            if (req.role === "YOUTUBER") {
                user = await prisma.user.findUnique({
                    where: { id: id },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        picture: true,
                        youtuberProfile: {
                            select: {
                                id: true,
                                youtubeUsername: true,
                                youtuberSince: true,
                                channelName: true,
                                about: true,
                                subscribers: true,
                                views: true,
                                videos: true,
                            }
                        }
                    }
                })
            } else if (req.role === "TALENT") {
                user = await prisma.user.findUnique({
                    where: { id: id },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        picture: true,
                        talentProfile: {
                            select: {
                                id: true,
                                about: true,
                                rate: true,
                                workLocation: true,
                                workType: true,
                                topSkill: true,
                                skills: true,
                                experience: true,
                                location: true,
                                languages: true,
                                categories: true,
                                clients: true,
                            }
                        }
                    }
                })
            }
            else return res.status(400).json({ message: "invalid role" });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" })
        }

        if (!user) return res.status(404).json({ message: 'user not found' });
        return res.status(200).json({ user });
    },

    getYoutuberProfileById: async (req: RequestWithUser, res: Response) => {
        const id = req.params.id;

        try {
            const user = await prisma.user.findUnique({
                where: { id: id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    picture: true,
                    youtuberProfile: {
                        select: {
                            id: true,
                            youtubeUsername: true,
                            youtuberSince: true,
                            channelName: true,
                            about: true,
                            subscribers: true,
                            views: true,
                            videos: true,
                        }
                    }
                }
            })
            if (!user) return res.status(404).json({ message: 'user not found' });
            return res.status(200).json({ user });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'internal server error' });
        }
    },

    getTalentProfileById: async (req: RequestWithUser, res: Response) => {
        const id = req.params.id;

        try {
            const user = await prisma.user.findUnique({
                where: { id: id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    picture: true,
                    talentProfile: {
                        select: {
                            id: true,
                            about: true,
                            rate: true,
                            workLocation: true,
                            workType: true,
                            topSkill: true,
                            skills: true,
                            experience: true,
                            location: true,
                            languages: true,
                            categories: true,
                            clients: true,
                        }
                    }
                }
            })
            if (!user) return res.status(404).json({ message: 'user not found' });
            return res.status(200).json({ user });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: 'internal server error' });
        }
    },

    getYoutuberVerifedStatus: async (req: RequestWithUser, res: Response) => {
        const id = req.userId;

        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: id
                },
                select: {
                    youtuberProfile: true
                }
            })
            if (!user) return res.status(404).json({ message: 'user not found' });
            const isVerified: boolean = user.youtuberProfile !== null;
            return res.status(200).json({ isVerified });
        } catch (e) {
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
    },

    deleteUser: async (req: RequestWithUser, res: Response) => {
        const id = req.params.id;
        if (!id) return res.status(400).json({ "message": "invalid request" });

        const userId = req.userId;
        if (userId !== id) return res.status(403).json({ 'message': "forbidden" });

        const user = await prisma.user.findUnique({where: {id : id}});
        if(!user) return res.status(404).json({"message": "user not found"});

        await prisma.user.delete({ where: { id: id } });

        return res.status(200).json({ "message": "success" });
    }
}