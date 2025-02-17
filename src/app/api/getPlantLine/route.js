export async function GET(){
    try {
        const response = await fetch('http://10.24.7.70:8080/getgreenTAGarea');

        const jsonData = await response.json();
        const newResponse = new Response(JSON.stringify(jsonData), { 
            status: 200,
            headers: { 'Content-Type' : 'application/json' } 
        });
        return newResponse;
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch Plant & Line data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}