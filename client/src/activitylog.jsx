import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "loginLogs"),
          orderBy("loggedInAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Activity log error:", err);
        setError("Could not load the activity log. Check your Firestore rules.");
      }
    }
    load();
  }, []);

  return (
    <section className="section" style={{ marginTop: "var(--s6)" }} aria-labelledby="log-title">
      <div className="section__head">
        <h2 id="log-title">Activity Log</h2>
        <p className="muted">Last 50 logins</p>
      </div>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Date and Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={2}>No logins recorded yet.</td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.email}</td>
                  <td>{l.loggedInAt?.toDate ? l.loggedInAt.toDate().toLocaleString() : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
