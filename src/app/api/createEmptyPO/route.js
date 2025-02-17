import { createEmptyPO } from "@/app/dbPO";

export async function POST(req){
    const { startTime, endTime, plant, line, groupSelection } = await req.json();
    console.log("Received data: \n", startTime, endTime, plant, line, groupSelection);
    try {
        if (!startTime || !endTime || !plant || !line || !groupSelection) {
            return new Response(
              JSON.stringify({ error: 'All fields are required' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
        }

        const rowsAffected = await createEmptyPO({ startTime, endTime, plant, line, groupSelection });

        return new Response(JSON.stringify({rowsAffected: rowsAffected.rowsAffected,
            message: rowsAffected.message,
            id: rowsAffected.id
            }), {
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