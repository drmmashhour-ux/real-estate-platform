"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function Properties() {
  const [data, setData] = useState<{ id: string; title: string; price: number }[]>(
    []
  );

  useEffect(() => {
    axios.get("/api/property").then((res) => setData(res.data));
  }, []);

  return (
    <div>
      {data.map((p) => (
        <div key={p.id}>
          {p.title} - {p.price}
        </div>
      ))}
    </div>
  );
}
