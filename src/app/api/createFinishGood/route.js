import { insertQuantity } from '@/app/dbDowntime';

export async function POST(req){
    const { qty, value, actual_start, group } = await req.json();
    console.log("Received Data: ", qty, value, actual_start, group);
    try {
        if (!qty || !value || !actual_start) {
            return new Response(
              JSON.stringify({ error: 'All fields are required' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
        }
        
        const response = await insertQuantity(qty, value, actual_start, group);

        return new Response(JSON.stringify({ success: true, response }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to insert quantity' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
}