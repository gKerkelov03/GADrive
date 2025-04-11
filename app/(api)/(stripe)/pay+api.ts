import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_intent_id, payment_method_id } = body;

    console.log("Confirming payment intent:", {
      payment_intent_id,
      payment_method_id,
    });

    if (!payment_intent_id || !payment_method_id) {
      console.error("Missing required fields:", {
        payment_intent_id,
        payment_method_id,
      });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    console.log("Confirming payment intent...");
    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: payment_method_id,
    });
    console.log("Payment intent confirmed:", result.status);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment successful",
        result: {
          client_secret: result.client_secret,
          status: result.status,
        },
      })
    );
  } catch (error) {
    console.error("Error in payment confirmation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500 }
    );
  }
}
