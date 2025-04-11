import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, amount } = body;

    console.log("Creating payment intent with data:", { name, email, amount });

    if (!name || !email || !amount) {
      console.error("Missing required fields:", { name, email, amount });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
        },
      );
    }

    let customer;
    console.log("Checking for existing customer...");
    const doesCustomerExist = await stripe.customers.list({
      email,
    });

    if (doesCustomerExist.data.length > 0) {
      console.log("Found existing customer");
      customer = doesCustomerExist.data[0];
    } else {
      console.log("Creating new customer...");
      const newCustomer = await stripe.customers.create({
        name,
        email,
      });
      customer = newCustomer;
    }

    console.log("Creating ephemeral key...");
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" },
    );

    console.log("Creating payment intent...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount) * 100,
      currency: "usd",
      customer: customer.id,
      payment_method_types: ["card"],
      confirm: false,
      capture_method: "automatic",
    });

    console.log("Payment intent created:", paymentIntent.id);

    return new Response(
      JSON.stringify({
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          status: paymentIntent.status,
        },
        ephemeralKey: ephemeralKey,
        customer: customer.id,
      }),
    );
  } catch (error) {
    console.error("Error in payment intent creation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500 },
    );
  }
}
