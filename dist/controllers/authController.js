import { OAuth2Client } from "google-auth-library";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ACCESS_TOKEN_URL = process.env.GOOGLE_ACCESS_TOKEN_URL;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
export const authController = {
    google: async (req, res) => {
        //step 1, simply redirect to google oauth url
        // const scopes = GOOGLE_OAUTH_SCOPES.join(" ");
        const url = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&scope=openid%20email%20profile%20&response_type=code&state=login`;
        return res.status(302).redirect(url);
    },
    callback: async (req, res) => {
        console.log("callback");
        if (!GOOGLE_ACCESS_TOKEN_URL) {
            return res.status(400).json({ message: "google access token url not found" });
        }
        // step 2, get AUTHORIZATION_CODE from query
        const { code } = req.query;
        console.log(code);
        if (!code) {
            return res.status(400).json({ message: "code not found" });
        }
        const data = {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_CALLBACK_URL,
            grant_type: "authorization_code",
        };
        console.log(data);
        //step 3, exchange AUTHORIZATION_CODE for ACCESS_TOKEN
        const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const accessTokenData = await response.json();
        const { id_token } = accessTokenData;
        console.log(id_token);
        // step 4, verify the id_token (manual is risky, so we use google-auth-library)
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID,
        });
        // step 5, get info from the ticket
        const payload = ticket.getPayload();
        if (!payload)
            return res.status(400).json({ message: "invalid token payload" });
        console.log(payload);
        return res.redirect("http://localhost:5173");
    }
};
