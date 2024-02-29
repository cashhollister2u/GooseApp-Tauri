// services/websocketService.js


class WebSocketService {
    private socket: WebSocket | null
    constructor() {
      this.socket = null;
    }
  
    connect(url: string) {
      this.socket = new WebSocket(url);
  
      // Connection opened
      this.socket.addEventListener('open', (event) => {
        console.log('WebSocket is connected');
      });
  
      // Listen for messages
      this.socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server ', data);
        // Handle incoming message
      });
  
      // Handle WebSocket closure
      this.socket.addEventListener('close', () => {
        console.log('WebSocket is closed');
        // Optionally reconnect or notify user
      });
  
      // Handle errors
      this.socket.addEventListener('error', (error: any) => {
        console.error('WebSocket error: ', error);
      });
    }
  
    sendMessage(message: any, recipientUserId: any) {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const messageData = {
            message: message,
            recipient_user_id: recipientUserId
        }
        this.socket.send(JSON.stringify(messageData))
      } else {
        console.error('WebSocket is not open. Cannot send message.');
      }
    }
  
    disconnect() {
      if (this.socket) {
        this.socket.close();
      }
    }
  }
  
  export const websocketService = new WebSocketService();
  