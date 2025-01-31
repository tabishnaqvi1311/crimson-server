import { Request, Response } from "express";
import prisma from "../utils/db.js";

interface UserController {
    getUsersByRole: (req: Request, res: Response) => any;
}

export const userController: UserController = {
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