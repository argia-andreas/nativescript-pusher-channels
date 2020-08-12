import { TNSPusherBase, TNSPusherChannelBase, TNSPusherConnectionBase } from './pusher.common';
import { Options } from './interfaces';
export * from './interfaces';
export * from './enums';
export declare class TNSPusher extends TNSPusherBase {
    android: com.pusher.client.Pusher;
    connectionEvents: Map<Function, {
        event: string;
        listener: any;
        channelName: string;
    }>;
    channelEvents: Map<Function, {
        event: string;
        listener: any;
        channelName: string;
    }>;
    globalEvents: any[];
    constructor(apiKey: string, options?: Options);
    private static getConnectionStatus;
    private _connection;
    readonly connection: TNSPusherConnection;
    connect(): void;
    disconnect(): void;
    _subscriptions: any[];
    subscribe(channelName: string): TNSPusherChannel;
    unsubscribeAll(): void;
    unsubscribe(channelName: string): void;
    bind(callback: Function): this;
    unbind(callback: Function): void;
}
export declare class TNSPusherChannel extends TNSPusherChannelBase {
    channel: com.pusher.client.channel.Channel | com.pusher.client.channel.PrivateChannel | com.pusher.client.channel.PresenceChannel;
    android: com.pusher.client.Pusher;
    ref: TNSPusher;
    constructor(instance: any, channel: any, ref: TNSPusher);
    readonly name: string;
    bind(event: string, callback: Function): void;
    unbind(event: string, callback: Function): void;
    trigger(event: string, data: any): void;
}
export declare class TNSPusherConnection extends TNSPusherConnectionBase {
    android: com.pusher.client.Pusher;
    ref: TNSPusher;
    _state: any;
    constructor(instance: any, ref: TNSPusher);
    bind(event: string, callback: Function): void;
    unbind(event: string, callback?: Function): void;
    readonly state: any;
}
