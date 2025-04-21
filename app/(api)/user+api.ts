import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { first_name, last_name, email, phone, clerkId } =
      await request.json();

    if (!first_name || !last_name || !email || !clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First check if user with this email already exists
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existingUser.length > 0) {
      console.log(
        "User with this email already exists, returning existing user"
      );
      return Response.json({ data: existingUser[0] }, { status: 200 });
    }

    // If user doesn't exist, create a new one
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
        ${phone || null},
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
