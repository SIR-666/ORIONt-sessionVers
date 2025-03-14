import { getQualityLossProcessingMaster } from "@/app/dbDowntime";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sterilizer = searchParams.get("sterilizer");
    const tank = searchParams.get("tank");
    const step = searchParams.get("step");

    console.log("Retrieved Data: \n", sterilizer, tank, step);

    if (!sterilizer || !tank || !step) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await getQualityLossProcessingMaster(sterilizer, tank, step);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch quality loss data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
