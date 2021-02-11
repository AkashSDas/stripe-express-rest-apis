import { auth } from "./firebase";

const API = "http://localhost:8000";

/**
 * A helper function to fetch data from your API
 */
export async function fetchFromAPI(endpointURL, opts) {
  const { method, body } = { method: "POST", body: null, ...opts };

  /**
   * Once the user is logged in, firebase creates a JWT with the
   * user's details in the frontend
   *
   * We can authenticate request that goes to the backend API by
   * setting this token as a header on the request
   */

  const user = auth.currentUser;
  const token = user && (await user.getIdToken());

  const res = await fetch(`${API}/${endpointURL}`, {
    method,
    ...(body && { body: JSON.stringify(body) }),
    headers: {
      "Content-Type": "application/json",

      // Below is the standard format for JWT authentication
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}
