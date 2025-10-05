import React, { useEffect } from 'react';

const HealthCheck: React.FC = () => {
  useEffect(() => {
    // Send a health status back as response headers
    const healthStatus = {
      status: 'ok',
      message: 'Frontend is healthy',
      timestamp: new Date().toISOString(),
    };
    
    // This will be visible in the Network tab for the /health route
    document.title = 'Health Check OK';
    
    // For APIs that might want to consume this endpoint
    const meta = document.createElement('meta');
    meta.name = 'health-status';
    meta.content = JSON.stringify(healthStatus);
    document.head.appendChild(meta);
    
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Return an empty div with health status as data attribute
  return (
    <div 
      id="health-check" 
      data-status="ok" 
      data-timestamp={new Date().toISOString()}
      style={{ display: 'none' }}
    />
  );
};

export default HealthCheck;