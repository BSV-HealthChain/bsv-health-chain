import React, { useState } from "react";
import LoginModal from "./LoginModal";

const LoginButton: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
          px-4 py-2
          bg-blue-600 
          text-white 
          rounded-lg 
          shadow 
          hover:bg-blue-700 
          transition 
          duration-200
          font-medium
        "
      >
        Login
      </button>

      {open && <LoginModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default LoginButton;
