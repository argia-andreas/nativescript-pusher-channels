import { TNSPusherBase, TNSPusherChannelBase, TNSPusherConnectionBase } from './pusher.common';
import { Options } from './interfaces';
export * from './interfaces';
export * from './enums';
export declare class TNSPusher extends TNSPusherBase {
    ios: Pusher;
    private readonly _delegate;
    _globalEvents: Map<Function, string>;
    _channelEvents: Map<Function, {
        channelName: string;
        event: string;
        id: string;
    }>;
    _connectionEvents: Map<Function, {
        event: string;
        id: string;
    }>;
    constructor(apiKey: string, options?: Options);
    connect(): void;
    disconnect(): void;
    private _connection;
    readonly connection: TNSPusherConnection;
    bind(callback: Function): this;
    unbind(callback: Function): void;
    subscribe(event: string): TNSPusherChannel;
    unsubscribeAll(): void;
    unsubscribe(channelName: string): void;
}
export declare class TNSPusherChannel extends TNSPusherChannelBase {
    channel: PusherChannel;
    ios: Pusher;
    connection: any;
    ref: WeakRef<TNSPusher>;
    constructor(instance: any, channel: any, ref: WeakRef<TNSPusher>);
    readonly name: string;
    trigger(event: string, data: any): void;
    bind(event: string, callback: Function): void;
    unbind(event: string, callback: Function): void;
}
export declare class TNSPusherConnection extends TNSPusherConnectionBase {
    ios: Pusher;
    _state: any;
    ref: WeakRef<TNSPusher>;
    constructor(instance: any, ref: WeakRef<TNSPusher>);
    bind(event: string, callback: Function): void;
    unbind(event: string, callback?: Function): void;
    readonly state: any;
}
