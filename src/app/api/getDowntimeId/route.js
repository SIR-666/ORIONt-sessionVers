import { getDowntimeId } from "@/app/dbDowntime";

export async function GET(req){
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        console.log("Received id: ", id);

        const data = await getDowntimeId(id);
        console.log("Data Retrieved: ", data);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch downtime data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}