import { createStoppage } from "@/app/dbDowntime";

export async function POST(req) {
  const {
    machine,
    code,
    startTime,
    endTime,
    duration,
    comments,
    shift,
    line,
    type,
    group,
    plant,
  } = await req.json();
  console.log(
    "Received data: \n",
    machine,
    code,
    startTime,
    endTime,
    duration,
    comments,
    shift,
    line,
    type,
    group,
    plant
  );
  try {
    if (
      !machine ||
      !startTime ||
      !endTime ||
      !duration ||
      !comments ||
      !shift ||
      !line ||
      !type ||
      !group ||
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

    if (isNaN(duration) || duration < 0) {
      return new Response(
        JSON.stringify({ error: "Duration must be a non-negative integer" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Here you might want to validate startTime format
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid start time format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const rowsAffected = await createStoppage({
      machine,
      code,
      startTime,
      endTime,
      duration,
      comments,
      shift,
      line,
      type,
      group,
      plant,
    });

    if (rowsAffected.error) {
      // Send conflict response if there's an overlap
      return new Response(
        JSON.stringify({
          message: "This entry overlaps with an existing entry.",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, rowsAffected }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update downtime" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
