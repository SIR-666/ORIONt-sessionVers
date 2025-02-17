import { getSpeedSKU } from "@/app/dbPO";

export async function POST(req){
    try {
        const { sku } = await req.json();
        console.log("Retrieved data in serverless: ", sku);
        
        if (!sku) {
            return new Response(JSON.stringify({ error: 'SKU is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await getSpeedSKU(sku);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch SKU data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}