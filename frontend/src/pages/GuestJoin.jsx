import React, { useState } from "react";
import { Button, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function GuestJoin() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const handleJoin = () => {
    const code = meetingCode.trim();

    if (!code) {
      return;
    }

    navigate(`/${code}`);
  };

  return (
    <div className="meetContainer">
      <div className="leftPanel">
        <div>
          <h2>Join a PeerLink Meeting</h2>

          <div style={{ display: "flex", gap: "10px" }}>
            <TextField
              label="Meeting Code"
              value={meetingCode}
              onChange={(event) => setMeetingCode(event.target.value)}
              variant="outlined"
            />

            <Button variant="contained" onClick={handleJoin}>
              Join
            </Button>
          </div>
        </div>
      </div>

      <div className="rightPanel">
        <img src="/logo3.png" alt="PeerLink meeting" />
      </div>
    </div>
  );
}