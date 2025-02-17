import { getDowntimeCategory } from "@/app/dbDowntime";

export async function GET(){
    try {
        const data = await getDowntimeCategory();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch downtime category data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}