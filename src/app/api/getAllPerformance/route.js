import url from "@/app/url";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url, "http://10.24.0.81:3001");
    const plant = searchParams.get("plant") || "";

    if (!plant) {
      console.error("❌ Error: Parameter 'plant' is required");
      return new Response(
        JSON.stringify({ error: "Parameter 'plant' is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🚀 Fetching data for plant: ${plant}`);

    const data = await fetch(
      `${url.URL}/getAllPerformance?plant=${encodeURIComponent(plant)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log(`📡 Response Status: ${data.status}`);

    if (!data.ok) {
      console.error(
        "❌ API responded with error:",
        data.status,
        data.statusText
      );
      return new Response(
        JSON.stringify({ error: `Failed to fetch data: ${data.statusText}` }),
        { status: data.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const jsonData = await data.json();
    console.log("✅ Data received:", jsonData);

    return new Response(JSON.stringify(jsonData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🔥 Internal Server Error:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
