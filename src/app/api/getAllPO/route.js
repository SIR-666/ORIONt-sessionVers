import { getAllPO } from "@/app/dbPO";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const value = url.searchParams.get("value");
    const shift = url.searchParams.get("shift");
    const date = url.searchParams.get("date");
    const plant = url.searchParams.get("plant");
    console.log("Received Value: ", value);

    const time = new Date(date);
    const year = time.getFullYear();
    const month = time.getMonth() + 1;
    console.log("Current Year: ", year);
    console.log("Current Month: ", month);

    console.log("Request Params: ", { value, year, month, shift, date, plant });

    const data = await getAllPO(value, year, month, shift, date, plant);
    console.log("Data Retrieved: ", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch all PO data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
