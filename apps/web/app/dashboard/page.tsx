"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [listings, setListings] = useState<any[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/my-listings");
      const data = await res.json();
      if (Array.isArray(data)) {
        setListings(data);
      } else {
        console.error("Expected array from /api/my-listings", data);
      }
    } catch (err) {
      console.error("Error loading my listings:", err);
    }
  }

  async function remove(id: string) {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      const res = await fetch("/api/listings/" + id, {
        method: "DELETE",
      });
      if (res.ok) {
        load();
      } else {
        const error = await res.json();
        alert("Error deleting listing: " + (error.error || res.statusText));
      }
    } catch (err) {
      console.error("Failed to delete listing:", err);
      alert("Failed to delete listing. Check console.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>My Listings</h1>

      {listings.length === 0 && <p>You haven't created any listings yet.</p>}

      {listings.map((l) => (
        <div key={l.id} style={{ marginBottom: 20, border: "1px solid #ccc", padding: 15, borderRadius: 8 }}>
          <h3>{l.title}</h3>
          <p>{l.city}, {l.country} - ${l.price}</p>
          <button 
            onClick={() => remove(l.id)}
            style={{ backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
