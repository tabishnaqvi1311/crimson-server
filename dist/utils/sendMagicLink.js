import { Resend } from "resend";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);
export default async function sendMagicLink(email, token) {
    if (!RESEND_API_KEY)
        throw new Error("RESEND_API_KEY is not defined");
    if (!email || !token)
        throw new Error("email or token is not defined");
    await resend.emails.send({
        from: "Tabish <onboarding@usecrimson.me>",
        to: [email],
        subject: "Sign in to your account",
        html: `
  <body>
      <p>Hi there, <br /><br />
    We noticed a login attempt to your Crimson account. To continue, please click the button below to verify your identity and log in securely:</p>
        <a href="http://localhost:8080/auth/verify?token=${token}">
        Click here to login
    </a>
    <h3>Weren't expecting this email?</h3>
<p>If you weren't trying to sign in to Crimson, you can safely ignore this email. Someone must have incorrectly entered your email address.</p>
<h3 >Need Help?</h3>
  <p>
    If you're having trouble logging in or didn't request this email, feel free to reach out to our support team at tabish.naqvi2003@gmail.com
  </p>
  </body>
</html>`
    });
}
