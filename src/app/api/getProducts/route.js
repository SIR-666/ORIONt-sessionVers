import url from "@/app/url";

export async function GET(req) {
  try {
    // Ambil parameter dari URL
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    // Validasi input
    if (!ids) {
      return new Response(
        JSON.stringify({ error: "Product IDs are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Panggil API backend (karena SQL ada di backend terpisah)
    const backendURL = `${url.URL}/getProducts?ids=${encodeURIComponent(ids)}`;
    const response = await fetch(backendURL);

    if (!response.ok) {
      throw new Error("Failed to fetch product data from backend");
    }

    const data = await response.json();
    console.log("Data fetched from backend:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching product data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch product data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
