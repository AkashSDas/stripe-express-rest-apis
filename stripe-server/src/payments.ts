/**
 * /// 3D Secure Payments ///
 *
 * Payment Intent API is there to replace some of Stripe's previous APIs like Charges
 * The reason for Stripe to replace this older APIs is due to new regulations about
 * strong customer authentication and 3D secure in Europe. The gist is that certain
 * payments needs to authorized with the actual credit card issuer. So for dev, if you
 * try to charge a card then there are some cases where the actual user might have to go
 * and login to their credit card account to authorize the charge
 *
 * The payment intent api contains additional mechanisms for managing the state of the
 * payment through out this process and when that authorization is needed Stripe can
 * handle it for us on the frontend
 *
 * Process in Steps for Dev:
 * 1. User is ready to pay
 * 2. Create a Payment Intent (Server)
 * 3. Collect card details (React)
 * 4. Submit PI and Card to Stripe (React)
 *
 * When user is ready to purchase, you'll create a PI for the amount the user intents
 * to pay, on the server. You then send the PI to your frontend app and then use Stripe
 * Elements to securely collect user's credit card info. At that point you are ready to
 * send to Stripe and tell Stripe to attempt the charge. If the charge is successful the
 * Stripe will send you a conformation but if it needs additional verification Stripe will
 * pull up a popup window and prompting that user to login with their bank and after they
 * go through that process, Stripe will finalize the payment.
 *
 * Most users won't need to go through this additional auth step but if the have to then
 * Stripe handles it
 */

import { stripe } from ".";

/**
 * Create a Payment Intent with a specific amount
 *
 */

export async function createPaymentIntent(amount: number) {
  // In this implementation we don't have authenticated users or anything like that, this is
  // just one off payment and it doesn't even require a user to be logged in to our app. However
  // it is possible to passin in existing customer or an existing payment source to your payment
  // intent

  // The paymentIntent object return from stripe will have an id and a status. The status of
  // the payment intent will change over the lifecycle of the payment, usually this is managed by
  // Stripe directly but it's good to remember it.

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    // receipt_email: 'james@gmail.com',
  });

  return paymentIntent;
}

/**
 * Create a Payment Intent and attempt to charge right away,
 * must have an existing customer with a saved card payment method on file.
 */

export async function createPaymentIntentAndCharge(
  amount: number,
  customer: string,
  payment_method: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    customer,
    payment_method,
    currency: "usd",
    off_session: true,
    confirm: true,
  });

  return paymentIntent;
}
