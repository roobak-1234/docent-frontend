import * as signalR from "@microsoft/signalr";

/**
 * SignalR Service
 * Connects to Azure SignalR Service to receive real-time updates.
 */

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private events: { [key: string]: Array<(data: any) => void> } = {};

    constructor() {
        // Initialize logic could act here, but connection is usually explicit
    }

    public async startConnection(url: string, token: string = ""): Promise<void> {
        try {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(url, { accessTokenFactory: () => token })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            this.connection.onclose(async () => {
                console.log('SignalR Connection lost. Retrying...');
                // Logic to handle reconnect manually if automatic fails
            });

            await this.connection.start();
            console.log('SignalR Connected!');

        } catch (err) {
            console.error('SignalR Connection Error: ', err);
            setTimeout(() => this.startConnection(url, token), 5000);
        }
    }

    public on(eventName: string, callback: (data: any) => void) {
        if (!this.connection) return;

        // Register local wrapper if not already registered
        if (!this.events[eventName]) {
            this.events[eventName] = [];
            this.connection.on(eventName, (data: any) => {
                this.events[eventName].forEach(cb => cb(data));
            });
        }

        this.events[eventName].push(callback);
    }

    public off(eventName: string, callback: (data: any) => void) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    public async send(methodName: string, ...args: any[]) {
        if (!this.connection) {
            console.warn("SignalR not connected. Cannot send data.");
            return;
        }
        await this.connection.invoke(methodName, ...args);
    }
}

export const signalRService = new SignalRService();
