import { createContext, useState } from "react";

// Toast state lives here, mounted once at the top of the app (App.jsx),
// so every page — including code that runs before a page renders <Shell>,
// like Settings.jsx and ClientProfile.jsx — is a descendant of the
// Provider and can safely call useContext(ToastContext).
export const ToastContext = createContext({ toast: null, showToast: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}
      {toast && (
        <div
          className={`toast ${toast.type}`}
          style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60 }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
