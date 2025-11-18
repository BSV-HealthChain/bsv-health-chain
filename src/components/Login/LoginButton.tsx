import React, { useState } from "react";
import LoginModal from "./LoginModal";

const LoginButton: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          background: "#111827",
          color: "white",
        }}
      >
        Login
      </button>

      {open && <LoginModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default LoginButton;
