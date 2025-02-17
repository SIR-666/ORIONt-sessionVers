import { insertQualityLoss } from '@/app/dbDowntime';

export async function POST(req){
    const { filling, packing, sample, qual, value, actual_start, group } = await req.json();
    console.log("Received Data: \n", filling, packing, sample, qual, value, actual_start, group);
    try {
        if (filling == null || packing == null || sample == null || qual == null || value == null || actual_start == null) {
            return new Response(
              JSON.stringify({ error: 'All fields are required' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
        }
        
        const response = await insertQualityLoss(filling, packing, sample, qual, value, actual_start, group);

        return new Response(JSON.stringify({ success: true, response }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to insert quality loss' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
}