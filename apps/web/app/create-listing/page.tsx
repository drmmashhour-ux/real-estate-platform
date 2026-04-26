"use client";

import { useState } from "react";

export default function CreateListingPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  async function handleSubmit() {
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: Number(price),
          city,
          country,
        }),
      });

      if (res.ok) {
        window.location.href = "/listings";
      } else {
        const error = await res.json();
        alert("Error creating listing: " + (error.error || res.statusText));
      }
    } catch (err) {
      console.error("Failed to submit listing:", err);
      alert("Failed to submit listing. Check console.");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Listing</h1>

      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} style={{ padding: 8, width: 300 }} />
      <br /><br />

      <input placeholder="Price" onChange={(e) => setPrice(e.target.value)} type="number" style={{ padding: 8, width: 300 }} />
      <br /><br />

      <input placeholder="City" onChange={(e) => setCity(e.target.value)} style={{ padding: 8, width: 300 }} />
      <br /><br />

      <input placeholder="Country" onChange={(e) => setCountry(e.target.value)} style={{ padding: 8, width: 300 }} />
      <br /><br />

      <button onClick={handleSubmit} style={{ padding: "10px 20px", cursor: "pointer" }}>Create</button>
    </div>
  );
}
