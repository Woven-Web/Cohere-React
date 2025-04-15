
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-yellow-500">404</h1>
        <p className="text-xl text-foreground mb-6">
          Oops! We couldn't find the page you're looking for
        </p>
        <p className="text-muted-foreground mb-8">
          The page at <code className="bg-secondary px-2 py-1 rounded">{location.pathname}</code> doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => window.history.back()}>
            <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
