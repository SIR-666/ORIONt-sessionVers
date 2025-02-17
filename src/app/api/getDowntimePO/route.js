import { getDowntimePO } from "@/app/dbDowntime";

export async function POST(req){
    try {
        const { date_start, date_end, line } = await req.json();
        console.log("Retrieved Data: \n", date_start, date_end, line);

        if (!date_start || !date_end || !line) {
            return new Response(JSON.stringify({ error: 'All fields are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await getDowntimePO(date_start, date_end, line);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch downtimes in a PO' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}