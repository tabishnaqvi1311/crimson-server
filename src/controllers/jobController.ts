import { Request, Response } from "express";
import prisma from "../utils/db.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

// temporary workround until i add zod
enum WorkLocation {
    REMOTE = "REMOTE",
    ONSITE = "ONSITE",
    HYBRID = "HYBRID"
}

enum WorkType {
    FULL_TIME = "FULL_TIME",
    PART_TIME = "PART_TIME",
    PROJECT_BASED = "PROJECT_BASED"
}

enum JobStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    DRAFT = "DRAFT",
    EXPIRED = "EXPIRED"
}
interface JobController {
    getAllJobs: (req: Request, res: Response) => void;
    getJobById: (req: Request, res: Response) => void;
    getJobsByYoutuberId: (req: Request, res: Response) => void;
    createJob: (req: RequestWithUser, res: Response) => void;
    updateJob: (req: RequestWithUser, res: Response) => void;
    deleteJob: (req: RequestWithUser, res: Response) => void;
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

        if (!title || !workLocation || !workType) {
            return res.status(400).json({ message: "invalid request" });
        }

        if (!Object.values(WorkLocation).includes(workLocation as WorkLocation)) {
            return res.status(400).json({ message: "invalid request" });
        }

        if (!Object.values(WorkType).includes(workType as WorkType)) {
            return res.status(400).json({ message: "invalid request" });
        }

        const user = await prisma.user.findUnique({
            where: { id: id }, include: { youtuberProfile: true }
        })

        if (!user) return res.status(400).json({ message: "invalid request" });

        // added verification check also do in frontend ->
        if (user.youtuberProfile === null) {
            return res.status(400).json({ message: "not verified" });
        }

        try {
            const job = await prisma.job.create({
                data: {
                    title,
                    description,
                    salary: salary.length === 0 ? "-" : salary,
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
    updateJob: async (req: RequestWithUser, res: Response) => {
        const { id } = req.params;

        const { title, description, salary, workLocation, workType, status } = req.body;

        const job = await prisma.job.findUnique({
            where: { id: id },
            select: {
                id: true,
                posterId: true
            }
        })

        if (!job) return res.status(404).json({ message: 'job not found' });

        if (job.posterId !== req.userId) {
            return res.status(400).json({ message: "invalid request" });
        }

        //TODO : add validation for salary, workLocation, workType, status using zod
        if (!Object.values(WorkLocation).includes(workLocation as WorkLocation)) {
            return res.status(400).json({ message: "invalid request" });
        }

        if (!Object.values(WorkType).includes(workType as WorkType)) {
            return res.status(400).json({ message: "invalid request" });
        }

        if (!Object.values(JobStatus).includes(status as JobStatus)) {
            return res.status(400).json({ message: "invalid request" });
        }

        try {

            const updatedJob = await prisma.job.update({
                where: { id: id },
                data: {
                    title,
                    description,
                    salary,
                    workLocation,
                    workType,
                    status,
                    updatedAt: new Date()
                },
                select: {
                    title: true,
                    description: true,
                    salary: true,
                    workLocation: true,
                    workType: true,
                    status: true,
                    poster: {
                        select: {
                            id: true,
                        }
                    }
                }
            })
            return res.status(200).json({ updatedJob });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    },
    deleteJob: async (req: RequestWithUser, res: Response) => {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        })

        if (!user || user.role !== "YOUTUBER") {
            return res.status(400).json({ message: "invalid request" });
        }

        const job = await prisma.job.findUnique({
            where: { id: id }
        })

        if (!job) return res.status(404).json('not found');

        try {
            await prisma.job.delete({
                where: { id: id }
            })
            return res.status(200).json({ job });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    }
}