import { insertQualityLoss } from "@/app/dbDowntime";

export async function POST(req) {
  const { filling, packing, sample, qual, value, actual_start, group, plant } =
    await req.json();
  console.log(
    "Received Data: \n",
    filling,
    packing,
    sample,
    qual,
    value,
    actual_start,
    group,
    plant
  );
  try {
    if (
      filling == null ||
      packing == null ||
      sample == null ||
      qual == null ||
      value == null ||
      actual_start == null ||
      !plant
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response = await insertQualityLoss(
      filling,
      packing,
      sample,
      qual,
      value,
      actual_start,
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
      JSON.stringify({ error: "Failed to insert quality loss" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
