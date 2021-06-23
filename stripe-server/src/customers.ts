/**
 * Customers in Stripe allow us to handle subscriptions, save credit cards to user
 * accounts and pull up an entire history of payments that user has made to you
 */

import Stripe from "stripe";
import { stripe } from ".";
import { db } from "./firebase";

/**
 * Creates a SetupIntent used to save a credit card for latest user
 *
 * Process of saving a credit card on a customer account is very similar
 * to how the payment intent api works, instead of payment intent you
 * create a setup intent and only parameter it requires is the customer id
 */
export async function createSetupIntent(userId: string) {
  const customer = await getOrCreateCustomer(userId);
  return stripe.setupIntents.create({
    customer: customer.id,
  });
}

/**
 * Returns all the payment sources associated to the user
 */
export async function listPaymentMethods(userId: string) {
  const customer = await getOrCreateCustomer(userId);
  return stripe.paymentMethods.list({
    customer: customer.id,
    type: "card",
  });
}

/**
 * Gets the existing Stripe customer or create a new record
 * This function will link the Firebase user to a Stripe Customer
 * record
 *
 * This is a very useful helper function in our Stripe backend and
 * can be used in combination with other endpoints like when we
 * create a setup intent to save a card or to get the user's payment
 * method
 */
export async function getOrCreateCustomer(
  userId: string,
  params?: Stripe.CustomerCreateParams
) {
  const userSnapshot = await db.collection("users").doc(userId).get();
  const { stripeCustomerId, email } = userSnapshot.data() || {};

  // If missing customer id, create it
  if (!stripeCustomerId) {
    // CREATE new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        firebaseUID: userId,
      },
      ...params,
    });

    // Only drawback of adding the stripeCustomerId in the firebase user
    // doc is that the data become stale
    await userSnapshot.ref.update({ stripeCustomerId: customer.id });

    return customer;
  } else {
    return (await stripe.customers.retrieve(
      stripeCustomerId
    )) as Stripe.Customer;
  }
}
