import React from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import { Checkout, CheckoutFail, CheckoutSuccess } from "./Checkout";
import Customers from "./Customers";
import Payments from "./Payments";
import Subscriptions from "./Subscriptions";

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul className="navbar-nav">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/checkout">
                <span aria-label="emoji" role="img">
                  🛒
                </span>{" "}
                Checkout
              </Link>
            </li>
            <li>
              <Link to="/payments">
                <span aria-label="emoji" role="img">
                  💸
                </span>{" "}
                Payments
              </Link>
            </li>
            <li>
              <Link to="/customers">
                <span aria-label="emoji" role="img">
                  🧑🏿‍🤝‍🧑🏻
                </span>{" "}
                Customers
              </Link>
            </li>
            <li>
              <Link to="/subscriptions">
                <span aria-label="emoji" role="img">
                  🔄
                </span>{" "}
                Subscriptions
              </Link>
            </li>
          </ul>
        </nav>

        <main>
          <Switch>
            <Route path="/checkout">
              <Checkout />
            </Route>
            <Route path="/payments">
              <Payments />
            </Route>
            <Route path="/customers">
              <Customers />
            </Route>
            <Route path="/subscriptions">
              <Subscriptions />
            </Route>
            <Route path="/success">
              <CheckoutSuccess />
            </Route>
            <Route path="/failed">
              <CheckoutFail />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <>
      <div class="well">
        <h2>Stripe React + Node.js</h2>
      </div>
    </>
  );
}

export default App;
