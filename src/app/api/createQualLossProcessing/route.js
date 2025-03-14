import { insertQualityLossProcessing } from "@/app/dbDowntime";

export async function POST(req) {
  const {
    blowAwal,
    drainAkhir,
    sirkulasi,
    unplannedCIP,
    qual,
    value,
    actual_start,
    group,
    plant,
  } = await req.json();
  console.log(
    "Received Data: \n",
    blowAwal,
    drainAkhir,
    sirkulasi,
    unplannedCIP,
    qual,
    value,
    actual_start,
    group,
    plant
  );
  try {
    if (
      blowAwal == null ||
      drainAkhir == null ||
      sirkulasi == null ||
      unplannedCIP == null ||
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

    const response = await insertQualityLossProcessing(
      blowAwal,
      drainAkhir,
      sirkulasi,
      unplannedCIP,
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
