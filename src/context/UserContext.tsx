import React, { createContext, useState, useContext } from "react";

export type UserRole = "patient" | "provider" | null;

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const UserContext = createContext<UserContextType>({
  role: null,
  setRole: () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(
    (localStorage.getItem("role") as UserRole) || null
  );

  const updateRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole) localStorage.setItem("role", newRole);
  };

  return (
    <UserContext.Provider value={{ role, setRole: updateRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
