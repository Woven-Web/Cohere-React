
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  ListFilter, 
  PlusCircle,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck
} from 'lucide-react';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut, isSubmitter, isCurator, loading } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link-active' : '';
  };

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
            
            <nav className="hidden md:flex space-x-1">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                <ListFilter className="h-4 w-4 mr-1 inline" />
                List
              </Link>
              <Link to="/calendar" className={`nav-link ${isActive('/calendar')}`}>
                <Calendar className="h-4 w-4 mr-1 inline" />
                Calendar
              </Link>
              <Link to="/map" className={`nav-link ${isActive('/map')}`}>
                <MapPin className="h-4 w-4 mr-1 inline" />
                Map
              </Link>
              {isSubmitter && (
                <Link to="/submit" className={`nav-link ${isActive('/submit')}`}>
                  <PlusCircle className="h-4 w-4 mr-1 inline" />
                  Submit
                </Link>
              )}
              {isCurator && (
                <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                  <ShieldCheck className="h-4 w-4 mr-1 inline" />
                  Admin
                </Link>
              )}
            </nav>
            
            <div className="flex items-center space-x-2">
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
      
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
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
