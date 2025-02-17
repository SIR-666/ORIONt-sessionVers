import URL from "@/app/url";

export async function GET(req){
    try {
        const data = await fetch(`${URL.URL}/getAllDowntime`, { cache: 'no-store' });
        const jsonData = await data.json();
        const newResponse = new Response(JSON.stringify(jsonData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        return newResponse;
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch downtime data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}