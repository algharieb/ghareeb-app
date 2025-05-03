import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Chat from "@/pages/chat";
import Admin from "@/pages/admin";
import AdminChat from "@/pages/admin-chat";
import Profile from "@/pages/profile";
import { AuthProvider, useAuth } from "@/lib/storage";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.FC<any>; adminOnly?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    window.location.href = '/';
    return null;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    window.location.href = '/chat';
    return null;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/chat">
        {() => <ProtectedRoute component={Chat} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={Admin} adminOnly={true} />}
      </Route>
      <Route path="/admin-chat">
        {() => <ProtectedRoute component={AdminChat} adminOnly={true} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
