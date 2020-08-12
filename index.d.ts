import { TNSPusherBase, TNSPusherChannelBase, TNSPusherConnectionBase } from './pusher.common';

export interface ChannelEventMap {
    binding: any;
    callback: Function;
}

export interface Options {
    activityTimeout?: number;
    cluster?: string;
    encrypted?: boolean;
    host?: string;
    pongTimeout?: number;
    port?: number;
    autoReconnect?: boolean;
    authEndpoint?: string;
    authorizer?: (channel: any, options: any) => {
        authorize: (socketId: any, callback: any) => void;
    };
    wsPort?: number;
    wssPort?: number;
    auth?: {
        headers?: Object;
        params?: Object;
    };
}

export enum ConnectionStatus {
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTING = 'disconnecting',
    DISCONNECTED = 'disconnected',
    RECONNECTING = 'reconnecting'
}

export interface ConnectionStatusEvent {
    current: ConnectionStatus;
    previous: ConnectionStatus;
}

export declare class TNSPusher extends TNSPusherBase {
    /**
     * Native ios (instance)[https://github.com/pusher/pusher-websocket-swift]
     */
    ios: any;
    /**
     * Native android (instance)[https://github.com/pusher/pusher-websocket-java]
     */
    android: any;

    constructor(apiKey: string, options?: Options);

    connection: TNSPusherConnectionBase;

    connect(): void;

    disconnect(): void;

    subscribe(channelName: string): TNSPusherChannelBase;

    unsubscribe(channelName: string): void;

    unsubscribeAll(): void;

    bind(callback: Function): void;

    unbind(callback: Function): void;
}
