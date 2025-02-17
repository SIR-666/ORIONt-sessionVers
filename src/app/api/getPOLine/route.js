import { getPOLine } from "@/app/dbPO";

export async function GET(req){
    try {
        const url = new URL(req.url);
        const value = url.searchParams.get('value');
        console.log("Received Value: ", value);
        
        const data = await getPOLine(value);
        console.log("Data Retrieved: ", data);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch all PO data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}