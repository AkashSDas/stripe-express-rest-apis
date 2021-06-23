/**
 * /// Stripe Checkouts ///
 *
 * It can handle checkout, subscriptions, future payments. Drop in flow, it
 * handles the UI, 3D secure authentication, can be localized into multiple
 * languages.
 *
 * Drawback: limitated customization in payment flow, the entire page is
 * hosted by stripe and if they decided to change something then 😵, since
 * you are now subject to any changes they make in future.
 *
 * If the payment is successful then stirpe will redirect to success url
 * and if payment has failed then stripe will redirect to fail url.
 *
 * After the payment is sucessfully done, you have to fulfill the product,
 * that will depend on your product. The easiest way to fulfill a product
 * is to simply go on to the stripe dashboard and do everything manually.
 * Like if you have to ship a product then you grab the user's address
 * and then you ship out the product and maybe email the user a tracting
 * number and stuff like that, But this is not scalable. Many devs would
 * want to automate the fulfillment of the product. In most cases you do
 * that is with a webhook. When a checkout session is finished, stripe
 * will send a webhook to your server and it'll be contain all the data
 * from that session, when you see that webhook you update the database,
 * send email to customer, and much more...
 */

import Stripe from "stripe";
import { stripe } from ".";

/**
 * Creates a Stripe Checkout session with line items
 */
export async function createStripeCheckoutSession(
  line_items: Stripe.Checkout.SessionCreateParams.LineItem[]
) {
  // Example Item
  // {
  //     name: 'T-shirt',
  //     description: 'Comfortable cotton t-shirt',
  //     images: ['https://example.com/t-shirt.png'],
  //     amount: 500,
  //     currency: 'usd',
  //     quantity: 1,
  //   }
  // 500 in amount == $5.00

  const url = process.env.WEBAPP_URL;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url}/failed`,
  });

  return session;
}
