import { useStripe } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { fetchFromAPI } from "./helpers";

export function Checkout() {
  const stripe = useStripe();

  // line item
  const [product, setProduct] = useState({
    name: "T-Shirt",
    description: "BullDog t-shirt. A t-shirt your bulldog will love.",
    images: [
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1049&q=80",
    ],
    amount: 799,
    currency: "usd",
    quantity: 0,
  });

  const changeQuantity = (v) =>
    setProduct({ ...product, quantity: Math.max(0, product.quantity + v) });

  const handleClick = async (event) => {
    const body = { line_items: [product] };
    const { id: sessionId } = await fetchFromAPI("checkouts", {
      body,
    });

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      console.log(error);
    }
  };

  return (
    <>
      <h2>Stripe Checkout</h2>
      <p>
        Shopping-cart scenario. Change the quantity of the products below, then
        click checkout to open the Stripe Checkout window.
      </p>

      <div className="product">
        <h3>{product.name}</h3>
        <h4>Stripe Amount: {product.amount}</h4>

        <img src={product.images[0]} width="250px" alt="product" />

        <button
          className="btn btn-sm btn-warning"
          onClick={() => changeQuantity(-1)}
        >
          -
        </button>
        <span style={{ margin: "20px", fontSize: "2em" }}>
          {product.quantity}
        </span>
        <button
          className="btn btn-sm btn-success"
          onClick={() => changeQuantity(1)}
        >
          +
        </button>
      </div>

      <hr />

      <button
        className="btn btn-primary"
        onClick={handleClick}
        disabled={product.quantity < 1}
      >
        Start Checkout
      </button>
    </>
  );
}

export function CheckoutSuccess() {
  const url = window.location.href;

  /**
   * We can use this session id to make a request through our API
   * to stripe to retrieve that session and maybe show invoice url
   * and things like that
   *
   * Once the payment is successfully done, you have to fulfill the product
   * which can be done in 2 ways
   * 1. Fulfill Manually (from stripe dashboard which works fine if you
   *      have physical product in low volume)
   * 2. Automate with Webhooks (when the checkout session is completed stripe
   *      will send a webhook to your server which is like an event that you
   *      listen to, that can trigger some additional backend process like
   *      sending a user confirmation email, updating their purchase in the
   *      database or starting their shipment flow)
   */
  const sessionId = new URL(url).searchParams.get("session_id");
  return <h3>Checkout was a Success! {sessionId}</h3>;
}

export function CheckoutFail() {
  return <h3>Checkout failed!</h3>;
}
