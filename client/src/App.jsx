import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./login.jsx";
import Catalog from "./catalog.jsx";
import Admin from "./admin.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      let r = null;
      try {
        if (u) {
          // Role lives in Firestore: users/{uid} -> { role: "admin" }
          const snap = await getDoc(doc(db, "users", u.uid));
          r = snap.exists() && snap.data().role === "admin" ? "admin" : "user";
        }
      } catch (err) {
        console.error("Role error:", err);
        r = u ? "user" : null;
      }
      setRole(r);
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="loading" role="status">Loading...</p>;

  const home = role === "admin" ? "/admin" : "/catalog";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to={home} replace /> : <Login />} />
        <Route
          path="/catalog"
          element={user && role === "user" ? <Catalog /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin"
          element={user && role === "admin" ? <Admin /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
