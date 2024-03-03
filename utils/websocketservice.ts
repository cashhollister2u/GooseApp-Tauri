// services/websocketService.js


class WebSocketService {
    private socket: WebSocket | null

    private messageHandler: ((data: any) => void) | null;

    constructor() {
      this.socket = null;
      this.messageHandler = null;
    }

    setMessageHandler(handler: (data: any) => void) {
      this.messageHandler = handler;
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
        // Check if a message handler is set, then call it with the received data
        if (this.messageHandler) {
          this.messageHandler(data);
        }
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
    
    sendMessage(message: any, reciever_id: any) {
      console.log(this.socket?.readyState )
      if (this.socket?.readyState === WebSocket.OPEN) {
        const messageData = {
            type: 'chat.message',
            message: message,
            reciever_user_id: reciever_id,
        }
        this.socket.send(JSON.stringify(messageData))
        console.log('sendMessage accepted from socket file', messageData)
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
  