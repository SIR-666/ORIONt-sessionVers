// import { getCatProd } from "@/app/db";

export async function GET(req){
    try {
        const url = new URL(req.url);
        const cat  = url.searchParams.get('category');
        
        if (!cat) {
            return new Response(JSON.stringify({ error: 'ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch SKU data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}