
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import EventList from "./pages/EventList";
import CalendarView from "./pages/CalendarView";
import MapView from "./pages/MapView";
import EventDetail from "./pages/EventDetail";
import EditEvent from "./pages/EditEvent";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Submit from "./pages/Submit";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainLayout><EventList /></MainLayout>} />
            <Route path="/calendar" element={<MainLayout><CalendarView /></MainLayout>} />
            <Route path="/map" element={<MainLayout><MapView /></MainLayout>} />
            <Route path="/event/:id" element={<MainLayout><EventDetail /></MainLayout>} />
            <Route path="/admin/edit-event/:id" element={<MainLayout><EditEvent /></MainLayout>} />
            <Route path="/signin" element={<MainLayout><SignIn /></MainLayout>} />
            <Route path="/signup" element={<MainLayout><SignUp /></MainLayout>} />
            <Route path="/submit" element={<MainLayout><Submit /></MainLayout>} />
            <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
