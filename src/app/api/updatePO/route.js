import { updatePO, updateTimeStamps } from "@/app/dbPO";

export async function POST(req) {
    const { id, date, line, status, group, actual_start, actual_end, groupSelection, poStart, poEnd } = await req.json();
    console.log("Received data: \n", id, date, line, status, group, actual_start, actual_end, groupSelection, poStart, poEnd);
    try {
      if (!id || !line || !status || (!date && !actual_start && !actual_end)) {
        return new Response(
          JSON.stringify({ error: 'ID, date, line, status, and at least one identifier are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (actual_start || actual_end) {
        // Update only timestamps
        const rowsAffected = await updateTimeStamps(id, date, actual_start, actual_end, poStart, poEnd);
        return new Response(
            JSON.stringify({ success: true, rowsAffected }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
      } else {
        const rowsAffected = await updatePO(id, date, line, status, group, groupSelection);
        return new Response(JSON.stringify({ success: true, rowsAffected }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: `Failed to update order: ${error.message}` }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }