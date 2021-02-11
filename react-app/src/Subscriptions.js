import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { Suspense, useEffect, useState } from "react";
import { AuthCheck, useUser } from "reactfire";
import { SignIn, SignOut } from "./Customers";
import { db } from "./firebase";
import { fetchFromAPI } from "./helpers";

/**
 * In this implementation of Subscription UI we are always creating
 * a new account (this how it is setup in the backend api) and if
 * a customer has a card saved already then we can use that too for
 * subscribing to a plan (for this changes needs to be made in frontend
 * and backend of this app)
 */

function UserData(props) {
  const [data, setData] = useState({});

  // Subscribe to the user's data in Firestore
  useEffect(() => {
    const unsubscribe = db
      .collection("users")
      .doc(props.user.data.uid)
      .onSnapshot((doc) => setData(doc.data()));
    return () => unsubscribe();
  }, [props.user]);

  return (
    <pre>
      Stripe Customer ID: {data.stripeCustomerId} <br />
      Subscriptions: {JSON.stringify(data.activePlans || [])}
    </pre>
  );
}

function SubscribeToPlan(props) {
  const stripe = useStripe();
  const elements = useElements();
  const user = useUser();

  const [plan, setPlan] = useState();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get current subscriptions on mount
  useEffect(() => {
    getSubscriptions();
  }, [user]);

  // Fetch current subscriptions from the API
  const getSubscriptions = async () => {
    if (user) {
      const subs = await fetchFromAPI("subscriptions", { method: "GET" });
      setSubscriptions(subs);
    }
  };

  // Cancel a subscription
  const cancel = async (id) => {
    setLoading(true);
    await fetchFromAPI("subscriptions/" + id, { method: "PATCH" });
    alert("canceled!");
    await getSubscriptions();
    setLoading(false);
  };

  // Handle the submission of card details
  const handleSubmit = async (event) => {
    setLoading(true);
    event.preventDefault();

    const cardElement = elements.getElement(CardElement);

    // Create Payment Method
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Create Subscription on the Server
    const subscription = await fetchFromAPI("subscriptions", {
      body: {
        plan,
        payment_method: paymentMethod.id,
      },
    });

    // The subscription contains an invoice
    // If the invoice's payment succeeded then you're good,
    // otherwise, the payment intent must be confirmed

    // The subscription contains an invoice which has a payment intene object
    // If the invoice's payment succeeded then you're good and firestore document
    // should be updated to reflected those changes. It means payment is done.
    // However, there is a chance that 3D secure verification needs to happen here
    // so if that is the case then the status will be `requires_action` and to handle
    // that we call stripe.confirmPayment with the client_secret on the payment intent
    // and that will prompt the user to login with their bank to verify the payment
    // and it will complete the process to make the subscription

    const { latest_invoice } = subscription;

    if (latest_invoice.payment_intent) {
      const { client_secret, status } = latest_invoice.payment_intent;

      if (status === "requires_action") {
        const { error: confirmationError } = await stripe.confirmCardPayment(
          client_secret
        );
        if (confirmationError) {
          console.error(confirmationError);
          alert("unable to confirm card");
          return;
        }
      }

      // success
      alert("You are subscribed!");
      getSubscriptions();
    }

    setLoading(false);
    setPlan(null);
  };

  return (
    <>
      <h2>Subscriptions</h2>
      <p>
        Subscribe a user to a recurring plan, process the payment, and sync with
        Firestore in realtime.
      </p>
      <AuthCheck fallback={<SignIn />}>
        <div className="well">
          <h2>Firestore Data</h2>
          <p>User's data in Firestore.</p>
          {user?.data?.uid && <UserData user={user} />}
        </div>

        <hr />

        <div className="well">
          <h3>Step 1: Choose a Plan</h3>

          {/* 
            Since there are limited plans that's why it's hardcoded but you need plans from
            or plan id is dynamic then you need to make an api call for that
          */}

          <button
            className={
              "btn " +
              (plan === "<price id for plan 1>"
                ? "btn-primary"
                : "btn-outline-primary")
            }
            onClick={() => setPlan("<price id for plan 1>")}
          >
            Choose Monthly $25/m
          </button>

          <button
            className={
              "btn " +
              (plan === "<price id for plan 2>"
                ? "btn-primary"
                : "btn-outline-primary")
            }
            onClick={() => setPlan("<price id for plan 2>")}
          >
            Choose Quarterly $50/q
          </button>

          <p>
            Selected Plan: <strong>{plan}</strong>
          </p>
        </div>
        <hr />

        <form onSubmit={handleSubmit} className="well" hidden={!plan}>
          <h3>Step 2: Submit a Payment Method</h3>
          <p>Collect credit card details</p>
          <p>
            Normal Card: <code>4242424242424242</code>
          </p>
          <p>
            3D Secure Card: <code>4000002500003155</code>
          </p>

          <hr />

          <CardElement />
          <button className="btn btn-success" type="submit" disabled={loading}>
            Subscribe & Pay
          </button>
        </form>

        <div className="well">
          <h3>Manage Current Subscriptions</h3>
          <div>
            {subscriptions.map((sub) => (
              <div key={sub.id}>
                {sub.id}. Next payment of {sub.plan.amount} due{" "}
                {new Date(sub.current_period_end * 1000).toUTCString()}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => cancel(sub.id)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="well">
          <SignOut user={user} />
        </div>
      </AuthCheck>
    </>
  );
}

export default function Subscriptions() {
  return (
    <Suspense fallback={"loading user"}>
      <SubscribeToPlan />
    </Suspense>
  );
}
