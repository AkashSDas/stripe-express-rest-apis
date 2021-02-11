import { config } from "dotenv";
import Stripe from "stripe";
import { app } from "./api";

// Environment Variables (Stripe API Key)
if (process.env.NODE_ENV !== "production") {
  config();
}

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2020-08-27",
});

// Start the API with Express
const port = process.env.PORT || 8000;
app.listen(port, () =>
  console.log(`API is available on http://localhost:${port}`)
);
