"use client";

import axios from "axios";
import { useState } from "react";

export default function Chat() {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");

  const send = async () => {
    const res = await axios.post("/api/chat", { message: msg });
    setReply(res.data.reply);
  };

  return (
    <div>
      <input onChange={(e) => setMsg(e.target.value)} />
      <button type="button" onClick={send}>
        Send
      </button>
      <p>{reply}</p>
    </div>
  );
}
