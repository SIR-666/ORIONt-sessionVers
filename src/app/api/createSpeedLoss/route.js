import { insertSpeedLoss } from "@/app/dbDowntime";

export async function POST(req) {
  const { speed, nominal, value, startTime, group, plant } = await req.json();
  console.log(
    "Received Data: ",
    speed,
    nominal,
    value,
    startTime,
    group,
    plant
  );
  try {
    if (!speed || !nominal || !value || !startTime || !group || !plant) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = await insertSpeedLoss(
      speed,
      nominal,
      value,
      startTime,
      group,
      plant
    );

    return new Response(JSON.stringify({ success: true, response }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to insert speed loss" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
