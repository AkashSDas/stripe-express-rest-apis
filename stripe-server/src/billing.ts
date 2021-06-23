import { firestore } from "firebase-admin";
import Stripe from "stripe";
import { stripe } from ".";
import { getOrCreateCustomer } from "./customers";
import { db } from "./firebase";

/**
 * Attaches a payment method to the Stripe customer,
 * subscribes to a Stripe plan, and saves the plan to Firestore
 */
export async function createSubscription(
  userId: string,
  plan: string,
  payment_method: string
) {
  const customer = await getOrCreateCustomer(userId);

  // If you have a payment method attached to a customer then
  // you can skip the next 2 lines of code, but here it is assumed
  // that it's a new user and haven't attached payment method

  // Attach the payment method to the customer
  await stripe.paymentMethods.attach(payment_method, { customer: customer.id });

  // Set it as the default payment method
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: payment_method },
  });

  // using expand parameter to tell stripe to also include the payment intent
  // when it returns this data from the API, otherwise it'll just return the
  // payment intent id but we want the entire payment intent object
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ plan }],
    expand: ["latest_invoice.payment_intent"],
  });

  // When Stripe creates a subscription it also attaches the first invoice
  // to it and attempts to pay for that invoice with the user's card. The
  // actual payment intent is found in the invoice object
  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const payment_intent = invoice.payment_intent as Stripe.PaymentIntent;

  // Update the user's status
  if (payment_intent.status === "succeeded") {
    // if the payment intent is successful then update the database
    // this is good to sync the plans with the firestore as we'll see
    // it frequently and it very useful

    // !NOTE: Filter the plans so that user can add a plan
    // ! only once because the plan will be created on Stripe
    // ! but won't be added in Firestore activePlans using
    // ! firestore.FieldValue.arrayUnion(plan). Also adding
    // ! same plan for same customer is a bad business logic

    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          stripeCustomerId: customer.id,
          activePlans: firestore.FieldValue.arrayUnion(plan),
        },
        { merge: true }
      );
  }

  return subscription;
}

/**
 * Cancels an active subscription, syncs the data in Firestore
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string
) {
  const customer = await getOrCreateCustomer(userId);
  if (customer.metadata.firebaseUID !== userId) {
    throw Error("Firebase UID does not match Stripe Customer");
  }

  const subscription = await stripe.subscriptions.del(subscriptionId);

  // Cancel at end of period
  // const subscription = await stripe.subscriptions.update(subscriptionId, {cancel_at_period_end: true})
  // If you cancel the subscription at the end of the period then you might want
  // setup a webhook which will listen to the subscription status and will update the
  // the database at the end of that period when that subscription is deleted

  // Here we are removing only one subscription at a time for a user
  // there getting the price (plan) id from price object using index
  // as 0 (since there will  be only single subscription that we want
  // to cancel)
  if (subscription.status === "canceled") {
    await db
      .collection("users")
      .doc(userId)
      .update({
        tmp: subscription,
        activePlans: firestore.FieldValue.arrayRemove(
          subscription.items.data[0].price.id
        ),
      });
  }

  return subscription;
}

/**
 * Returns all the subscriptions linked to a Firebase userID in Stripe
 */
export async function listSubscriptions(userId: string) {
  const customer = await getOrCreateCustomer(userId);
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
  });

  return subscriptions;
}
