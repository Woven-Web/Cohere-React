
import React from 'react';

const MapView = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Event Map</h1>
        <p className="text-muted-foreground">
          View events by location
        </p>
      </div>
      
      <div className="bg-muted p-12 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-4">Map View Coming Soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We're working on integrating a map view to help you discover events near you.
          Check back soon for this feature!
        </p>
      </div>
    </div>
  );
};

export default MapView;
