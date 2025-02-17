import { getDowntimeType } from "@/app/dbDowntime";

export async function GET(req){
    try {
        const url = new URL(req.url);
        const cat  = url.searchParams.get('cat');
        const line = url.searchParams.get('value');
        
        if (!cat || !line) {
            return new Response(JSON.stringify({ error: 'ID and line is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await getDowntimeType(cat, line);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch downtime type data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}