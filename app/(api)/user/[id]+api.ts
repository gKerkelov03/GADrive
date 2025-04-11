import { neon } from "@neondatabase/serverless";

export async function GET(request: Request, { id }: { id: string }) {
  if (!id) {
    return Response.json({ error: "Missing user ID" }, { status: 400 });
  }

  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Fetching user with clerk_id:", id);

    const user = await sql`
      SELECT * FROM users WHERE clerk_id = ${id} LIMIT 1
    `;

    console.log("Database response:", user);

    if (user.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ data: user[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
