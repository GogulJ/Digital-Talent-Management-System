import API from "../services/api";

/**
 * Calls the protected route using the stored JWT token.
 * Usage: import { fetchProtected } from "../utils/auth";
 *        const data = await fetchProtected();
 */
export const fetchProtected = async () => {
  const token = localStorage.getItem("token");
  const res = await API.get("/api/protected", {
    headers: {
      Authorization: token,
    },
  });
  return res.data;
};

/**
 * Logs out the user by clearing localStorage.
 */
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Returns the stored user object or null.
 */
export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

/**
 * Returns true if a token is stored in localStorage.
 */
export const isLoggedIn = () => !!localStorage.getItem("token");
