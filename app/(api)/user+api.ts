import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { first_name, last_name, email, phone_number, clerkId } =
      await request.json();

    if (!first_name || !last_name || !email || !clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      INSERT INTO users (
        first_name,
        last_name,
        email,
        phone_number,
        clerk_id
      ) 
      VALUES (
        ${first_name}, 
        ${last_name},
        ${email},
        ${phone_number || null},
        ${clerkId}
      )
      RETURNING *;
    `;

    return Response.json({ data: response[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json({ error: "Error creating user" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Get clerkId from path
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const clerkId = pathParts[pathParts.length - 1];

    console.log("API GET request for user with clerk_id:", clerkId);

    if (!clerkId) {
      return Response.json({ error: "Missing clerk ID" }, { status: 400 });
    }

    const user = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId} LIMIT 1
    `;

    if (user.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user:", user[0]);
    return Response.json({ data: user[0] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
