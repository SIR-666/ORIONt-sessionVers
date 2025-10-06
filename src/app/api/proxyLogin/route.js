import fetch from "node-fetch";

export async function POST(req) {
  try {
    const body = await req.json(); // Get the request body
    const response = await fetch("http://10.24.0.155:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const jsonData = await response.json();
      const newResponse = new Response(JSON.stringify(jsonData), {
        status: 200,
      });
      newResponse.headers.set("Access-Control-Allow-Origin", "*");
      return newResponse;
    } else {
      const errorText = await response.text();
      return new Response(errorText || "Unexpected response", {
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error forwarding request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
