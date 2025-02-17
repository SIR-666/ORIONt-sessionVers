import { deleteDowntime } from "@/app/dbDowntime";

export async function POST(req){
    const { id } = await req.json();
    console.log("Deleting stoppage id: ", id);

    try {
        const response = await deleteDowntime(id);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update downtime' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
}