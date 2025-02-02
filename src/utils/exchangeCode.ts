import { ExchangeBody } from "../types/ExchangeBody.js";

export default async function exchangeCode(data: ExchangeBody){
    try {
        const res = await fetch(process.env.GOOGLE_ACCESS_TOKEN_URL as string, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        if(!res.ok) throw new Error(`exchange failed with status ${res.status}`);
        const json = await res.json();
        return json;
    } catch (e) {
        console.log(e);
        return null;
    }
}