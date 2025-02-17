import { getPO } from "@/app/dbPO";

export async function GET(req){
    try {
        const url = new URL(req.url);
        const id  = url.searchParams.get('id');
        
        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await getPO(id);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch PO data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}