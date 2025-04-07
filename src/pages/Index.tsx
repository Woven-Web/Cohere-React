
import { Navigate } from 'react-router-dom';

const Index = () => {
  // This component simply redirects to the EventList page
  return <Navigate to="/" replace />;
};

export default Index;
