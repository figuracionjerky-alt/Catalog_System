import { useEffect, useRef, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import ActivityLog from "./activitylog.jsx";

// De-duplicated (the original list repeated a few names, which also caused duplicate React keys)
const CATEGORIES = [...new Set([
  "Body Care", "Skincare", "Facial Skincare", "Facial Skincare Sets", "Sun Care", "Bath & Body Cleansing", "Facial Cleansing", "Exfoliation",
  "Drinks & Supplements", "Dietary Supplements", "Vitamins", "Feminine Hygiene", "Personal Care", "Hand & Foot Care", "Deodorants", "Hair Removal",
  "Baby Care", "Lip Care", "Cleansing", "Hair Care", "Seasonings & Flavor Enhancers", "Cooking Ingredients", "Vinegar & Condiments", "Canned Seafood",
  "Dairy & Milk Products", "Snacks", "Powdered Drinks", "Beverages", "Instant Noodles", "Sauces & Condiments", "Pasta Sauces", "Noodles & Vermicelli",
  "Soup & Meal Mixes", "Coating & Breading Mixes", "Dessert Mixes",
])];

const euro = (n) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(Number(n) || 0);

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const cancelRef = useRef(null);
  const lastFocus = useRef(null);

  async function loadProducts() {
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Dialog: focus the safe action, close on Escape, restore focus on close
  useEffect(() => {
    if (!deleteTarget) return;
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return closeDialog();
      if (e.key !== "Tab") return;
      const f = document.querySelectorAll(".dialog button");
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!document.querySelector(".dialog").contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTarget]);

  function openDialog(p, trigger) {
    lastFocus.current = trigger;
    setDeleteTarget(p);
  }

  function closeDialog() {
    setDeleteTarget(null);
    lastFocus.current?.focus();
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setImage("");
    setCategory(CATEGORIES[0]);
  }

  function startEdit(p) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price);
    setImage(p.image);
    setCategory(p.category || CATEGORIES[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = { name, price: Number(price), image, category };
    if (editingId) {
      await updateDoc(doc(db, "products", editingId), data);
    } else {
      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
    resetForm();
    loadProducts();
  }

  async function confirmDelete() {
    await deleteDoc(doc(db, "products", deleteTarget.id));
    setDeleteTarget(null);
    loadProducts();
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar__brand">Catalog <span>/ Admin</span></div>
        <div className="topbar__right">
          <span className="topbar__user">{auth.currentUser?.email}</span>
          <button className="btn btn--sm" onClick={() => signOut(auth)}>
            Logout
          </button>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <h1>Admin Dashboard</h1>
          <p>{products.length} {products.length === 1 ? "product" : "products"}</p>
        </div>

        <div className="admin">
          <section className="panel admin__form" aria-labelledby="form-title">
            <div className="panel__head">
              <h2 id="form-title">
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
            </div>
            <form className="panel__body form-stack" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="p-name">Product Name</label>
                <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="p-price">Price (€)</label>
                <input id="p-price" className="input mono" type="number" inputMode="decimal" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="p-image">Picture Link</label>
                <input id="p-image" className="input" type="url" inputMode="url" value={image} onChange={(e) => setImage(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="p-cat">Category</label>
                <select id="p-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn--primary">
                  {editingId ? "Save Changes" : "Add Product"}
                </button>
                {editingId && (
                  <button type="button" className="btn" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <div>
            <section className="section" aria-labelledby="products-title">
              <div className="section__head">
                <h2 id="products-title">Products</h2>
              </div>
              {products.length === 0 ? (
                <p className="empty">No product yet. Add using the form</p>
              ) : (
                <ul className="rows">
                  {products.map((p) => (
                    <li key={p.id} className="row">
                      <img className="row__thumb" src={p.image} alt="" loading="lazy" />
                      <div className="row__info">
                        <h3 className="row__name">{p.name}</h3>
                        <p className="row__meta">{p.category || "No Category"}</p>
                      </div>
                      <p className="row__price">{euro(p.price)}</p>
                      <div className="row__actions">
                        <button
                          className="btn btn--sm"
                          onClick={() => startEdit(p)}
                          aria-label={`Edit the ${p.name}`}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--sm btn--danger"
                          onClick={(e) => openDialog(p, e.currentTarget)}
                          aria-label={`Delete the ${p.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <ActivityLog />
          </div>
        </div>
      </main>

      {deleteTarget && (
        <div className="dialog-backdrop" onClick={closeDialog}>
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="del-title"
            aria-describedby="del-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="del-title">Are you sure?</h2>
            <p id="del-desc">
              You will remove "{deleteTarget.name}". This cannot be undone.
            </p>
            <div className="dialog__actions">
              <button ref={cancelRef} className="btn" onClick={closeDialog}>
                Cancel
              </button>
              <button className="btn btn--danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
