import { deleteSpeedLoss } from "@/app/dbDowntime";

export async function POST(req){
    const { startTime, line } = await req.json();
    console.log("Parameters to delete: ", startTime, line);

    try {
        const response = await deleteSpeedLoss(startTime, line);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete speed loss' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
}