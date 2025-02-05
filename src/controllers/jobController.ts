import { Request, Response } from "express";
import prisma from "../utils/db.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

interface JobController {
    getAllJobs: (req: Request, res: Response) => void;
    getJobById: (req: Request, res: Response) => void;
    getJobsByYoutuberId: (req: Request, res: Response) => void;
    createJob: (req: RequestWithUser, res: Response) => void;
    updateJob: (req: Request, res: Response) => void;
    deleteJob: (req: Request, res: Response) => void;
}

export const jobController: JobController = {
    getAllJobs: async (req: Request, res: Response) => {
        try {
            const jobs = await prisma.job.findMany({
                where: {
                    status: "OPEN"
                },
                select: {
                    id: true,
                    title: true,
                    salary: true,
                    createdAt: true,
                    poster: {
                        select: {
                            id: true,
                            name: true,
                            picture: true,
                            youtuberProfile: {
                                select: {
                                    channelName: true,
                                    subscribers: true,
                                }
                            }
                        }
                    }
                },
            })
            return res.status(200).json({ jobs });
        } catch (e) {
            console.log(e);
            res.status(500).send({ message: "internal server error" });
        }
    },
    getJobById: async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) return res.status(400).json({ message: "invalid request" });

        try {
            const job = await prisma.job.findUnique({
                where: { id: id },
                select: {
                    title: true,
                    description: true,
                    salary: true,
                    workLocation: true,
                    workType: true,
                    status: true,
                    categories: true,
                    createdAt: true,
                    poster: {
                        select: {
                            name: true,
                            picture: true,
                            youtuberProfile: {
                                select: {
                                    channelName: true,
                                    subscribers: true,
                                }
                            }
                        }
                    }
                }
            })
            if (!job) return res.status(404).json({ message: "not found" });
            return res.status(200).json({ job });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "interval server error" });
        }
    },
    getJobsByYoutuberId: async (req: Request, res: Response) => {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: id }, select: { role: true }
        })

        if (!user || user.role !== "YOUTUBER") {
            return res.status(400).json({ message: "invalid request" });
        }

        try {
            const jobs = await prisma.job.findMany({
                where: {
                    posterId: id
                },
                select: {
                    title: true,
                    description: true,
                    salary: true,
                    createdAt: true,
                    status: true
                }
            })
            return res.status(200).json({ jobs });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }


    },
    createJob: async (req: RequestWithUser, res: Response) => {
        // TODO: take care of payments per post
        const { title, description, salary, workLocation, workType } = req.body;
        const id = req.userId;

        if (!title || !description || !salary || !workLocation || !workType) {
            return res.status(400).json({ message: "invalid request" });
        }

        if(workLocation !== "REMOTE" || workLocation !== "ONSITE" || workLocation !== "HYBRID") {
            return res.status(400).json({ message: "invalid request" });
        }

        if(workType !== "FULL_TIME" || workType !== "PART_TIME" || workType !== "PROJECT_BASED") {
            return res.status(400).json({ message: "invalid request" });
        }

        const user = await prisma.user.findUnique({
            where: { id: id }
        })

        if (!user) return res.status(400).json({ message: "invalid request" });

        try {
            const job = await prisma.job.create({
                data: {
                    title,
                    description,
                    salary: parseInt(salary),
                    workLocation: workLocation,
                    workType,
                    poster: {
                        connect: {
                            id: id
                        }
                    }
                }
            })

            return res.status(201).json({ job });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    },
    updateJob: (req: Request, res: Response) => {
        res.send("Update job");
    },
    deleteJob: (req: Request, res: Response) => {
        res.send("Delete job");
    }
}