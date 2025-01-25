import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = new Resend(RESEND_API_KEY);

export default async function sendMagicLink(email: string, token: string){
    if(!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not defined");
    if(!email || !token) throw new Error("email or token is not defined");
    await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: [email],
        subject: "Login to your account",
        html: `
            <a href="http://localhost:8080/auth/verify?token=${token}">Click here to login</a>
        `
    })
}