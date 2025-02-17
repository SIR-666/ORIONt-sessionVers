import { getGroup } from '@/app/dbPO';

export async function GET(req){
    try {
        const url = new URL(req.url);
        const plant  = url.searchParams.get('plant');
        
        if (!plant) {
            return new Response(JSON.stringify({ error: 'plant is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await getGroup(plant);
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch group data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}