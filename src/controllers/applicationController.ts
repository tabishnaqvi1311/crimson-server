import { Request, Response } from "express"
import prisma from "../utils/db.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

interface ApplicationController {
    getApplicationById: (req: Request, res: Response) => any,
    getApplicationsByUser: (req: Request, res: Response) => any,
    getApplicationsByJob: (req: Request, res: Response) => any,
    createApplication: (req: RequestWithUser, res: Response) => any,
    updateApplication: (req: Request, res: Response) => any,
    deleteApplication: (req: Request, res: Response) => any
}

function isProfileIncomplete(profile: any) {
    return !profile
        || !profile.talentProfile
        || !profile.talentProfile.rate
        || !profile.talentProfile.topSkill
        || !profile.talentProfile.workLocation
        || !profile.talentProfile.workType
        || !profile.talentProfile.location
        || !profile.talentProfile.languages
        || !profile.talentProfile.skills;
}


export const applicationController: ApplicationController = {
    getApplicationById: async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "invalid request" });

        try {
            const application = await prisma.application.findUnique({
                where: { id: id }
            })
            if (!application) return res.status(404).json({ message: "not found" });
            return res.status(200).json({ application });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    },
    getApplicationsByUser: async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "invalid request" });

        const { status, sort } = req.query;

        const whereClause: any = {}
        if (status) whereClause.status = status;

        const orderBy: any = { createdAt: "desc" };
        if (sort === "OLDEST") orderBy.createdAt = "asc";

        try {
            const userWithApplications = await prisma.user.findUnique({
                where: { id: id },
                select: {
                    applications: {
                        where: whereClause,
                        select: {
                            id: true,
                            coverLetter: true,
                            status: true,
                            createdAt: true,
                            job: {
                                select: {
                                    title: true,
                                    poster: {
                                        select: {
                                            id: true,
                                            name: true,
                                            picture: true,
                                        }
                                    }
                                }
                            }
                        },
                        orderBy,
                    },
                },
            })
            if (!userWithApplications) return res.status(404).json({ message: "not found" });
            return res.status(200).json({ applications: userWithApplications.applications })
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    },
    getApplicationsByJob: async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "invalid request" });

        try {
            const doesJobExist = await prisma.job.findUnique({ where: { id: id } });
            if (!doesJobExist) return res.status(404).json({ message: "not found" });

            const applications = await prisma.application.findMany({
                where: { jobId: id }
            })
            return res.status(200).json({ applications })
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    },
    createApplication: async (req: RequestWithUser, res: Response) => {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!id) return res.status(400).json({ message: "invalid request" });

        const { coverLetter } = req.body;
        if (!coverLetter) return res.status(400).json({ message: "invalid request" });

        try {
            const job = await prisma.job.findUnique({ where: { id: id } });
            if (!job) return res.status(404).json({ message: "not found" });

            if (job.status !== "OPEN") return res.status(400).json({ message: "job is not open" });


            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    talentProfile: {
                        select: {
                            rate: true,
                            topSkill: true,
                            skills: true,
                            location: true,
                            workLocation: true,
                            workType: true,
                            languages: true,
                        }
                    }
                }
            });


            if (!user) return res.status(404).json({ message: "not found" });
            if (isProfileIncomplete(user.talentProfile)) {
                return res.status(400).json({ message: "incomplete profile" });
            }

            // user can only apply once for a job
            const existingApplication = await prisma.application.findFirst({
                where: {
                    jobId: id,
                    applicantId: userId
                }
            })
            if (existingApplication) return res.status(400).json({ message: "already applied" });

            const application = await prisma.application.create({
                data: {
                    coverLetter,
                    job: {
                        connect: {
                            id: id
                        }
                    },
                    applicant: {
                        connect: {
                            id: userId
                        }
                    }
                },
            })
            res.status(201).json({ application });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    },
    updateApplication: async (req: Request, res: Response) => {
        const { id } = req.params;
    },
    deleteApplication: async (req: RequestWithUser, res: Response) => {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!id) return res.status(400).json({ message: "invalid request" });

        try {
            const application = await prisma.application.findUnique({
                where: { id: id },
            })
            if (!application) return res.status(404).json({ message: "not found" });
            if (application.applicantId !== userId) return res.status(403).json({ message: "forbidden" });

            await prisma.application.delete({ where: { id: id } });
            return res.status(200).json({ application });
        } catch (e) {
            console.log(e);
            return res.status(500).json({ message: "internal server error" });
        }
    }
}