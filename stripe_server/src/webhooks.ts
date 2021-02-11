/**
 * Webhooks provide a way to listen to different events that happen in the
 * Stripe API.
 *
 * For example a payment intent object returns an id and status, the state of
 * that object can change over the lifecycle of the payment. There are certain
 * events that we want to listen to and then code in response like when payment has
 * succeeded or failed
 *
 * In order to receive actual webhook event from Stripe we need to have a URL that's
 * available on the internet but if the app is not deployed then to test the webhooks
 * in development use Stripe CLI. It allows us to send test and mock webhooks in
 * development to localhost which means you don't need real URL on the internet for
 * testing
 *
 * *** Trigger Webhooks Locally ***
 *
 * Open a terminal to forward webhooks to the server.
 * command => stripe listen --forward-to localhost:8000/hooks
 *
 * Then open another terminal to trigger a mock webhook.
 * command => stripe trigger payment_intent.created
 *
 * To listen to certain webook using Stripe CLI
 * stripe listen --events=`event.status`
 * Example:
 * stripe listen --events=customer.subscription.deleted
 * stripe listen --events=customer.subscription.created
 * stripe listen --events=invoice.payment_succeeded
 * stripe listen --events=invoice.payment_failed
 */

import { Request, Response } from "express";
import { firestore } from "firebase-admin";
import Stripe from "stripe";
import { stripe } from "./";
import { db } from "./firebase";

/**
 * Business logic for specific webhook event types
 */
const webhookHandlers = {
  "checkout.session.completed": async (data: Stripe.Event.Data) => {
    // Add your business logic here
  },
  "payment_intent.succeeded": async (data: Stripe.PaymentIntent) => {
    // Add your business logic here
  },
  "payment_intent.payment_failed": async (data: Stripe.PaymentIntent) => {
    // Add your business logic here
  },
  "customer.subscription.deleted": async (data: Stripe.Subscription) => {
    const customer = (await stripe.customers.retrieve(
      data.customer as string
    )) as Stripe.Customer;
    const userId = customer.metadata.firebaseUID;
    const userRef = db.collection("users").doc(userId);

    await userRef.update({
      activePlans: firestore.FieldValue.arrayRemove(data.id),
    });
  },
  "customer.subscription.created": async (data: Stripe.Subscription) => {
    // One of the reason to implement this webhook is that in some cases
    // user may have to perform additional steps for verification on the payment
    // and when that payment is confirmed you want to be notified when the actual
    // subscription is created so that you can update their plan id or status in
    // the firestore

    const customer = (await stripe.customers.retrieve(
      data.customer as string
    )) as Stripe.Customer;

    const userId = customer.metadata.firebaseUID;
    const userRef = db.collection("users").doc(userId);

    await userRef.update({
      activePlans: firestore.FieldValue.arrayUnion(data.id),
    });
  },
  "invoice.payment_succeeded": async (data: Stripe.Invoice) => {
    // Add your business logic here
  },
  "invoice.payment_failed": async (data: Stripe.Invoice) => {
    // When an invoice payment fails you may not want to cancel that users
    // subscription right away because by default Stripe is going to re-try
    // to charge the user couple of times before its going to stop the collection
    // of that payment. A better approach might be to update that user's status
    // to PAST_DUE and implement some frontend UI which notifies the user to update
    // their default payment method otherwise their subscription will be automatically
    // cancelled in a few days. You should always assume that the user wants to
    // remain as a subscriber and would have to update their default payment method

    const customer = (await stripe.customers.retrieve(
      data.customer as string
    )) as Stripe.Customer;

    const userSnapshot = await db
      .collection("users")
      .doc(customer.metadata.firebaseUID)
      .get();
    await userSnapshot.ref.update({ status: "PAST_DUE" });
  },
};

/**
 * Validate the stripe webhook secret, then call the handler for the event type
 *
 * Stripe sends the data from this webhook in the request body and instead of
 * JSON, we actually want a raw buffer in this case. The reason we want buffer
 * because this is a sign request from Stripe, when we told the Stripe CLI to
 * listen to our localhost:8000 it printed out webhook signing secret. We can
 * use this value to ensure that the request actually came from Stripe (for security)
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  // req['rawBody'] == buffer
  const event = stripe.webhooks.constructEvent(
    req["rawBody"],
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  try {
    await webhookHandlers[event.type](event.data.object);
    res.send({ received: true });
  } catch (err) {
    console.error(err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
