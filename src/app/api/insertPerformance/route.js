import { insertPerformance } from "@/app/dbPO";

export async function POST(req) {
  const {
    net,
    running,
    production,
    operation,
    nReported,
    available,
    breakdown,
    processwait,
    planned,
    ut,
    startTime,
    line,
    group,
    plant,
  } = await req.json();
  console.log(
    "Received calculation data: ",
    net,
    running,
    production,
    operation,
    nReported,
    available,
    breakdown,
    processwait,
    planned,
    ut,
    startTime,
    line,
    group,
    plant
  );

  try {
    if (
      net === null ||
      running === null ||
      production === null ||
      operation === null ||
      nReported === null ||
      available === null ||
      breakdown === null ||
      processwait === null ||
      planned === null ||
      ut === null ||
      startTime === null ||
      line === null ||
      group === null ||
      plant === null
    ) {
      return new Response(
        JSON.stringify({ error: "Calculation data are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await insertPerformance(
      net,
      running,
      production,
      operation,
      nReported,
      available,
      breakdown,
      processwait,
      planned,
      ut,
      startTime,
      line,
      group,
      plant
    );
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: `Failed to update order: ${error.message}` }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
