"use client";

import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/auth-context";
import { ThemeProvider } from "./context/theme-context";
import { appRoutes } from "./routes";
import { createBrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [router, setRouter] = useState<ReturnType<typeof createBrowserRouter> | null>(null);

  useEffect(() => {
    setRouter(createBrowserRouter(appRoutes));
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        {router ? <RouterProvider router={router} /> : null}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}