export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  status: string;
}

export interface StripePaymentResult {
  client_secret: string;
  status: string;
}

export interface StripeCreateResponse {
  paymentIntent: StripePaymentIntent;
  customer: string;
}

export interface StripePayResponse {
  success: boolean;
  message: string;
  result: StripePaymentResult;
}
