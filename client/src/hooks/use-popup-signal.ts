import { useEffect, useRef, useCallback } from 'react';

export function usePopupSignal() {
  const wsRef = useRef<WebSocket | null>(null);
  const paymentListenersRef = useRef<Map<string, (success: boolean) => void>>(new Map());

  useEffect(() => {
    // Connect WebSocket to same port as main application with /ws path
    const isSecure = window.location.protocol === 'https:';
    const wsProtocol = isSecure ? 'wss:' : 'ws:';
    const wsUrl = `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/ws`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);

          if (data.type === 'popup_close') {
            console.log('Popup close signal received:', data.success);
            // Handle popup close here if needed
          } else if (data.type === 'payment_success') {
            console.log('Payment success signal received for transaction:', data.transactionUuid);
            // Call registered listeners for this transaction
            const listener = paymentListenersRef.current.get(data.transactionUuid);
            if (listener) {
              listener(true);
              // Remove listener after calling it
              paymentListenersRef.current.delete(data.transactionUuid);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendPopupClose = (success: boolean) => {
    fetch('https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/popup/close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success }),
    }).catch(error => {
      console.error('Error sending popup close signal:', error);
    });
  };

  const listenForPaymentSuccess = useCallback((transactionUuid: string, callback: (success: boolean) => void) => {
    paymentListenersRef.current.set(transactionUuid, callback);
    console.log('Registered payment listener for transaction:', transactionUuid);
  }, []);

  const removePaymentListener = useCallback((transactionUuid: string) => {
    paymentListenersRef.current.delete(transactionUuid);
    console.log('Removed payment listener for transaction:', transactionUuid);
  }, []);

  return { 
    sendPopupClose, 
    listenForPaymentSuccess, 
    removePaymentListener 
  };
}