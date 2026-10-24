import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import useContentProtection from "./useContentProtection.js";

const ALL = "All";

const CATEGORIES = [...new Set([
  "Body Care", "Skincare", "Facial Skincare", "Facial Skincare Sets", "Sun Care", "Bath & Body Cleansing", "Facial Cleansing", "Exfoliation",
  "Drinks & Supplements", "Dietary Supplements", "Vitamins", "Feminine Hygiene", "Personal Care", "Hand & Foot Care", "Deodorants", "Hair Removal",
  "Baby Care", "Lip Care", "Cleansing", "Hair Care", "Seasonings & Flavor Enhancers", "Cooking Ingredients", "Vinegar & Condiments", "Canned Seafood",
  "Dairy & Milk Products", "Snacks", "Powdered Drinks", "Beverages", "Instant Noodles", "Sauces & Condiments", "Pasta Sauces", "Noodles & Vermicelli",
  "Soup & Meal Mixes", "Coating & Breading Mixes", "Dessert Mixes",
])];

const euro = (n) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(Number(n) || 0);

export default function Catalog() {
  const hidden = useContentProtection();
  const email = auth.currentUser?.email || "";
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Load error:", err);
        setError("Could not load products.");
      }
    }
    load();
  }, []);

  // Only list categories that actually have products, with counts
  const counts = {};
  products.forEach((p) => {
    const c = p.category || "Others";
    counts[c] = (counts[c] || 0) + 1;
  });
  const categories = [
    ...CATEGORIES.filter((c) => counts[c]),
    ...Object.keys(counts).filter((c) => !CATEGORIES.includes(c)),
  ];

  const shown = products.filter((p) => {
    const matchName = (p.name || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === ALL || (p.category || "Others") === category;
    return matchName && matchCategory;
  });

  return (
    <div className={`protected${hidden ? " is-hidden" : ""}`}>
      <div className="watermark" aria-hidden="true">
        {Array.from({ length: 200 }).map((_, i) => (
          <span key={i}>{email}</span>
        ))}
      </div>

      <header className="topbar">
        <div className="topbar__brand">Catalog</div>
        <div className="topbar__right">
          <span className="topbar__user">{email}</span>
          <button className="btn btn--sm" onClick={() => signOut(auth)}>
            Logout
          </button>
        </div>
      </header>

      <main className="page">
        <div className="page-head page-head--row">
          <h1>Products</h1>
          <p className="result-count" role="status">
            {shown.length} / {products.length}
          </p>
        </div>

        {error && <p className="alert" role="alert">{error}</p>}

        <div className="browse">
          <nav className="rail" aria-label="Categories">
            <ul>
              {[ALL, ...categories].map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className="rail__item"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    <span>{c}</span>
                    <span className="rail__count">
                      {c === ALL ? products.length : counts[c]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="browse__main">
            <div className="browse__controls">
              <div className="field">
                <label className="sr-only" htmlFor="search">Search products</label>
                <input
                  id="search"
                  className="input"
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="field category-select">
                <label className="sr-only" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value={ALL}>{ALL} ({products.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c} ({counts[c]})</option>
                  ))}
                </select>
              </div>
            </div>

            {shown.length === 0 ? (
              <p className="empty">No products found.</p>
            ) : (
              <ul className="grid">
                {shown.map((p) => (
                  <li key={p.id} className="card">
                    <div className="card__media">
                      <img src={p.image} alt={p.name} loading="lazy" />
                    </div>
                    <div className="card__body">
                      <h2 className="card__name">{p.name}</h2>
                      <p className="card__meta">{p.category || "Others"}</p>
                      <p className="card__price">{peso(p.price)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
