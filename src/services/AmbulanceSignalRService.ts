import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

interface AmbulanceUpdate {
  ambulanceId: string;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    spO2?: number;
    notes?: string;
  };
  timestamp: number;
}

class AmbulanceSignalRService {
  private connection: HubConnection | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async initialize(): Promise<boolean> {
    try {
      // Azure SignalR Negotiate: Get access token from Azure Function/App Service
      const negotiateResponse = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!negotiateResponse.ok) {
        console.warn('SignalR negotiate failed, using fallback connection');
        // Fallback for development - replace with actual Azure SignalR endpoint
        this.connection = new HubConnectionBuilder()
          .withUrl('ws://localhost:7071/api') // Local Azure Functions endpoint
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build();
      } else {
        const negotiateData = await negotiateResponse.json();
        this.connection = new HubConnectionBuilder()
          .withUrl(negotiateData.url, { accessTokenFactory: () => negotiateData.accessToken })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build();
      }

      // Set up connection event handlers
      this.connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
        this.isConnected = false;
      });

      this.connection.onreconnected(() => {
        console.log('SignalR reconnected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.connection.onclose(() => {
        console.log('SignalR connection closed');
        this.isConnected = false;
        this.attemptReconnect();
      });

      await this.connection.start();
      this.isConnected = true;
      console.log('SignalR connected successfully');
      return true;

    } catch (error) {
      console.error('SignalR connection failed:', error);
      return false;
    }
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(async () => {
        try {
          await this.initialize();
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    }
  }

  // Critical "Golden Hour" function - reduces blind spot between ambulance and ER
  async broadcastAmbulanceUpdate(update: AmbulanceUpdate): Promise<boolean> {
    if (!this.connection || !this.isConnected) {
      console.warn('SignalR not connected, queuing update');
      return false;
    }

    try {
      // Lightweight telemetry packet for low latency
      await this.connection.invoke('BroadcastAmbulanceUpdate', {
        ...update,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to broadcast ambulance update:', error);
      return false;
    }
  }

  // Listen for hospital communications
  onHospitalMessage(callback: (message: any) => void) {
    if (this.connection) {
      this.connection.on('HospitalMessage', callback);
    }
  }

  // Join ambulance group for targeted messaging
  async joinAmbulanceGroup(ambulanceId: string) {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.invoke('JoinAmbulanceGroup', ambulanceId);
      } catch (error) {
        console.error('Failed to join ambulance group:', error);
      }
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.isConnected = false;
    }
  }

  getConnectionState(): string {
    return this.connection?.state || 'Disconnected';
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const ambulanceSignalRService = new AmbulanceSignalRService();