import fetch from "node-fetch";

export async function POST(req) {
    try {
        const body = await req.json(); // Get the request body
        const response = await fetch("", { // get the endpoint for registration
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
    
        if (response.ok) {
            const jsonData = await response.json();
            const newResponse = new Response(JSON.stringify(jsonData), { status: 200 });
            newResponse.headers.set("Access-Control-Allow-Origin", "*");
            return newResponse;
        } else {
            const errorText = await response.text();
            return new Response(errorText || "Unexpected response", { status: response.status });
        }
      } catch (error) {
        console.error("Error forwarding request:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
  }