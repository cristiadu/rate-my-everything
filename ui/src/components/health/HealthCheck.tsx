import React, { useEffect } from 'react'

const HealthCheck: React.FC = () => {
  useEffect(() => {
    const healthStatus = {
      status: 'ok',
      message: 'Frontend is healthy',
      timestamp: new Date().toISOString()
    }
    
    document.title = 'Health Check OK'
    
    const meta = document.createElement('meta')
    meta.name = 'health-status'
    meta.content = JSON.stringify(healthStatus)
    document.head.appendChild(meta)
    
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  return (
    <div 
      id="health-check" 
      data-status="ok" 
      data-timestamp={new Date().toISOString()}
      style={{ display: 'none' }}
    />
  )
}

export default HealthCheck