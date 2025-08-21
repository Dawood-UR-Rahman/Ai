import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import CreateInvoice from "@/pages/create-invoice";
import InvoiceHistory from "@/pages/invoice-history";
import InvoiceView from "@/pages/invoice-view";

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/" component={CreateInvoice} />
          <Route path="/create" component={CreateInvoice} />
          <Route path="/history" component={InvoiceHistory} />
          <Route path="/edit/:id" component={CreateInvoice} />
          <Route path="/view/:id" component={InvoiceView} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
