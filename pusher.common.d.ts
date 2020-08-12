import { ConnectionStatus } from './enums';
export * from './interfaces';
export * from './enums';
export declare enum InternalPusherEvents {
    Error = "pusher:error",
    Ping = "pusher:ping",
    Pong = "pusher:pong"
}
export declare abstract class TNSPusherBase {
    android: any;
    ios: any;
    abstract connect(): void;
    abstract disconnect(): void;
    abstract subscribe(channelName: string): TNSPusherChannelBase;
    abstract unsubscribe(channelName: string): void;
    abstract bind(callback: Function): this;
    abstract unbind(callback: Function): void;
    abstract unsubscribeAll(): void;
}
export declare abstract class TNSPusherConnectionBase {
    abstract bind(event: string, callback: Function): any;
    readonly state: ConnectionStatus;
}
export declare abstract class TNSPusherChannelBase {
    abstract bind(event: string, callback: Function): any;
    abstract unbind(event: string, callback?: Function): any;
    abstract trigger(event: string, data: Object): any;
}
