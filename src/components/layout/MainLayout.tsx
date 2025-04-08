
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  List, 
  PlusCircle,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  Menu
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut, isSubmitter, isCurator, loading } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link-active' : '';
  };

  // Navigation items that will be used in both desktop and mobile views
  const navItems = [
    { path: '/', label: 'List', icon: <List className="h-4 w-4" /> },
    { path: '/calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" /> },
    { path: '/map', label: 'Map', icon: <MapPin className="h-4 w-4" /> },
    ...(isSubmitter ? [{ path: '/submit', label: 'Submit', icon: <PlusCircle className="h-4 w-4" /> }] : []),
    ...(isCurator ? [{ path: '/admin', label: 'Curate', icon: <ShieldCheck className="h-4 w-4" /> }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-yellow-500 text-primary-foreground shadow-md">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold">
                Cohere Calendar
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`nav-link ${isActive(item.path)}`}
                >
                  {React.cloneElement(item.icon, { className: "h-4 w-4 mr-1 inline" })}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Navigation - Hamburger Menu for non-main navigation items */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                  <div className="flex flex-col gap-4 py-4">
                    {!loading && (
                      user ? (
                        <Button variant="outline" size="sm" onClick={() => signOut()}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Link to="/signin">
                            <Button variant="outline" size="sm" className="w-full">
                              <LogIn className="h-4 w-4 mr-2" />
                              Sign In
                            </Button>
                          </Link>
                          <Link to="/signup">
                            <Button variant="secondary" size="sm" className="w-full">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Desktop Authentication Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              {!loading && (
                <>
                  {user ? (
                    <Button variant="outline" size="sm" onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Link to="/signin">
                        <Button variant="outline" size="sm">
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button variant="secondary" size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t border-border md:hidden">
        <Tabs defaultValue={location.pathname} className="w-full">
          <TabsList className="w-full h-16 grid grid-cols-5 bg-background">
            {navItems.map((item, index) => {
              // Limit to 5 tabs maximum
              if (index < 5) {
                return (
                  <TabsTrigger 
                    key={item.path} 
                    value={item.path} 
                    className="flex flex-col items-center justify-center space-y-1 h-full data-[state=active]:bg-muted"
                    asChild
                  >
                    <Link to={item.path}>
                      {item.icon}
                      <span className="text-xs">{item.label}</span>
                    </Link>
                  </TabsTrigger>
                );
              }
              return null;
            })}
          </TabsList>
        </Tabs>
      </div>
      
      <footer className="bg-secondary py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cohere Community Calendar
            </div>
            <div className="mt-4 md:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground mr-4">
                About
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground mr-4">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
