import { getAllPOShift } from "@/app/dbPO";

export async function POST(req){
    try {
        const { line, date_start, date_end } = await req.json();
        console.log("Retrieved Data for shift: \n", line, date_start, date_end);
        const data = await getAllPOShift(line, date_start, date_end);

        console.log("Data from getAllPOShift:", data);

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch all PO in a shift' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}