import { getAllStoppages } from "@/app/dbDowntime";

export async function POST(req){
    try {
        const { line, date_start, date_end } = await req.json();
        console.log("Retrieved Data: \n", line, date_start, date_end);

        if (!line || !date_start || !date_end) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await getAllStoppages(line, date_start, date_end);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch all downtime data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}