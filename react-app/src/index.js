import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React from "react";
import ReactDOM from "react-dom";
import { FirebaseAppProvider } from "reactfire";
import App from "./App";
import "./index.css";

/**
 * You should load the stripe-js libary from a script tag only,
 * that's because, in order to be pci compliance you must always
 * pull the latest javascript from stripe.
 *
 * You can go in to the public folder and add the script tag to the
 * head of the html document there, however the stripe libary allows
 * us to handle this automatically from our react code
 *
 * loadStripe will automatically add the script tag to load stripe-js
 * in the head of the document. The stripePromise will async load stripe
 * and makes it available in our app
 *
 * Element is a provider that allows us to access the stripe react UI
 * components in our react app
 */

export const stripePromise = loadStripe("pk_test_...");

export const firebaseConfig = {
  // config...
};

ReactDOM.render(
  <React.StrictMode>
    {/* This will initialize firebase and give us access to it in out components */}
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      {/* making stripe available globally */}
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </FirebaseAppProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
