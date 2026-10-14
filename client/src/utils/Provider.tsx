import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider as Redux } from "react-redux";
import { store } from "@/store/store";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/pages/app/components/ScrollToTop";

const client = new QueryClient();

const Provider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={client}>
      <Redux store={store}>
        <BrowserRouter>
          <ScrollToTop />
          <SidebarProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </SidebarProvider>
          <Toaster />
        </BrowserRouter>
      </Redux>
    </QueryClientProvider>
  );
};

export default Provider;
