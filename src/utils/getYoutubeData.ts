export default async function getYoutubeData(access_token: string){
    try {
        const res = await fetch(process.env.YOUTUBE_API_URL as string, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        if(!res.ok) throw new Error(`failed to fetch data with status ${res.status}`);
        const json = await res.json();
        return json;
    } catch (e) {
        console.log(e);
        return null;
    }
}