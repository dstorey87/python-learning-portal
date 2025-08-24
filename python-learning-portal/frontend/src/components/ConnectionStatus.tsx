import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('connected');
  const [showBanner, setShowBanner] = useState(false);

  const checkBackendConnection = useCallback(async () => {
    // Don't show checking state unless we're already having issues
    if (backendStatus === 'connected') {
      // Silent background check
    } else {
      setBackendStatus('checking');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
      
      const response = await fetch('http://localhost:3050/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const newStatus = 'connected';
        if (backendStatus !== newStatus) {
          setBackendStatus(newStatus);
          // Hide banner after successful reconnection
          setTimeout(() => setShowBanner(false), 2000);
        }
      } else {
        setBackendStatus('disconnected');
        setShowBanner(true);
      }
    } catch (error) {
      setBackendStatus('disconnected');
      setShowBanner(true);
    }
  }, [backendStatus]);

  useEffect(() => {
    // Initial connection check (delayed to avoid flickering on load)
    const initialCheck = setTimeout(() => {
      checkBackendConnection();
    }, 1000);

    // Set up periodic health checks (less frequent to reduce performance impact)
    const healthCheckInterval = setInterval(checkBackendConnection, 120000); // Every 2 minutes

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      checkBackendConnection();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setBackendStatus('disconnected');
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(healthCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkBackendConnection]);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="text-red-500" size={16} />,
        text: 'No internet connection',
        color: 'bg-red-50 border-red-200 text-red-800'
      };
    }

    switch (backendStatus) {
      case 'connected':
        return {
          icon: <Wifi className="text-green-500" size={16} />,
          text: 'Connected',
          color: 'bg-green-50 border-green-200 text-green-800'
        };
      case 'checking':
        return {
          icon: <RefreshCw className="text-blue-500 animate-spin" size={16} />,
          text: 'Checking connection...',
          color: 'bg-blue-50 border-blue-200 text-blue-800'
        };
      case 'disconnected':
        return {
          icon: <AlertTriangle className="text-yellow-500" size={16} />,
          text: 'Backend disconnected',
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
      default:
        return {
          icon: <WifiOff className="text-gray-500" size={16} />,
          text: 'Unknown status',
          color: 'bg-gray-50 border-gray-200 text-gray-800'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Only show banner when there are actual connection issues
  if (isOnline && backendStatus === 'connected' && !showBanner) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${statusInfo.color} ${className}`}>
      {statusInfo.icon}
      <span className="font-medium">{statusInfo.text}</span>
      {backendStatus === 'disconnected' && (
        <button
          onClick={checkBackendConnection}
          className="ml-2 text-xs px-2 py-1 bg-white/50 hover:bg-white/80 rounded transition-colors"
        >
          Retry
        </button>
      )}
      {backendStatus === 'connected' && showBanner && (
        <button
          onClick={() => setShowBanner(false)}
          className="ml-2 text-xs px-2 py-1 bg-white/50 hover:bg-white/80 rounded transition-colors"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};