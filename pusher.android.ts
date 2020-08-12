import { TNSPusherBase, TNSPusherChannelBase, TNSPusherConnectionBase } from './pusher.common';
import { Options } from './interfaces';
import { ConnectionStatus } from './enums';

export * from './interfaces';
export * from './enums';

export class TNSPusher extends TNSPusherBase {
    android: com.pusher.client.Pusher;

    connectionEvents = new Map<Function,
        { event: string; listener: any; channelName: string }>();
    channelEvents = new Map<Function,
        { event: string; listener: any; channelName: string }>();
    globalEvents = [];

    constructor(apiKey: string, options?: Options) {
        super();
        if (options) {
            const opts = new com.pusher.client.PusherOptions();
            if (options.activityTimeout) {
                opts.setActivityTimeout(options.activityTimeout);
            }
            let authorizer = null;
            if (options.authEndpoint) {
                let endpoint = options.authEndpoint;
                if (options.auth && options.auth.params) {
                    Object.keys(options.auth.params).forEach((key, index) => {
                        const val = options.auth.params[key];
                        if (index === 0) {
                            endpoint = `${endpoint}?${key}=${val}`;
                        } else {
                            endpoint = `${endpoint}&${key}=${val}`;
                        }
                    });
                }
                authorizer = new com.pusher.client.util.HttpAuthorizer(endpoint);
            }
            if (authorizer instanceof com.pusher.client.util.HttpAuthorizer && options.auth && options.auth.headers) {
                const headers = new java.util.HashMap();
                Object.keys(options.auth.headers).forEach((key) => {
                    const val = options.auth.headers[key];
                    headers.put(key, val);
                });
                authorizer.setHeaders(headers);
            }
            if (options.authorizer) {
                /*authorizer = new com.pusher.client.Authorizer({
                    authorize(param0: string, param1: string): string {
                    }
                });*/
            }
            if (authorizer) {
                opts.setAuthorizer(authorizer);
            }
            if (options.cluster) {
                opts.setCluster(options.cluster);
            }
            if (options.encrypted) {
                opts.setEncrypted(options.encrypted);
            }
            if (options.host) {
                opts.setHost(options.host);
            }
            if (options.pongTimeout) {
                opts.setPongTimeout(options.pongTimeout);
            }
            if (options.wsPort) {
                opts.setWsPort(options.wsPort);
            }
            if (options.wssPort) {
                opts.setWssPort(options.wssPort);
            }
            this.android = new com.pusher.client.Pusher(apiKey, opts);
        } else {
            this.android = new com.pusher.client.Pusher(apiKey);
        }
    }

    private static getConnectionStatus(status): ConnectionStatus {
        switch (status) {
            case com.pusher.client.connection.ConnectionState.CONNECTED:
                return ConnectionStatus.CONNECTED;
            case com.pusher.client.connection.ConnectionState.CONNECTING:
                return ConnectionStatus.CONNECTING;
            case com.pusher.client.connection.ConnectionState.DISCONNECTED:
                return ConnectionStatus.DISCONNECTED;
            case com.pusher.client.connection.ConnectionState.DISCONNECTING:
                return ConnectionStatus.DISCONNECTING;
            default:
                return ConnectionStatus.RECONNECTING;
        }
    }

    private _connection: TNSPusherConnection;

    public get connection() {
        if (!this._connection) {
            this._connection = new TNSPusherConnection(this.android, this);
        }
        return this._connection;
    }

    connect(): void {
        const ref = new WeakRef<TNSPusher>(this);
        this.android.connect(
            new com.pusher.client.connection.ConnectionEventListener({
                onConnectionStateChange(
                    state: com.pusher.client.connection.ConnectionStateChange
                ) {
                    const owner = ref.get();
                    if (owner) {
                        const current = TNSPusher.getConnectionStatus(
                            state.getCurrentState()
                        );
                        const previous = TNSPusher.getConnectionStatus(
                            state.getPreviousState()
                        );
                        owner.connection._state = current;
                        const didConnect =
                            (previous === ConnectionStatus.CONNECTING &&
                                current === ConnectionStatus.CONNECTED) ||
                            (previous === ConnectionStatus.RECONNECTING &&
                                current === ConnectionStatus.CONNECTED);
                        owner.connectionEvents.forEach((ev, callback) => {
                            if (ev.event === 'state_change') {
                                callback({
                                    previous,
                                    current
                                });
                            }

                            if (ev.event === 'connected' && didConnect) {
                                callback();
                            }
                        });
                    }
                },
                onError(error: string, code: string, exception: java.lang.Exception) {
                }
            }),
            [com.pusher.client.connection.ConnectionState.ALL]
        );
    }

    disconnect(): void {
        this.android.disconnect();
    }

    _subscriptions = [];

    subscribe(channelName: string) {
        let subscription;
        const ref = new WeakRef<TNSPusher>(this);
        if (channelName.startsWith('private-')) {
            if (this.android.getPrivateChannel(channelName)) {
                return new TNSPusherChannel(
                    this.android,
                    this.android.getPrivateChannel(channelName),
                    this
                );
            }
            subscription = this.android.subscribePrivate(
                channelName,
                new com.pusher.client.channel.PrivateChannelEventListener({
                    onAuthenticationFailure(error: string, param1: java.lang.Exception) {
                        const owner = ref.get();
                        if (owner) {
                            owner.channelEvents.forEach((event, callback) => {
                                if (
                                    event.channelName === channelName &&
                                    event.event === 'pusher:subscription_error'
                                ) {
                                    callback({
                                        channelName,
                                        data: {
                                            code: null,
                                            message: error
                                        }
                                    });
                                }
                            });
                        }
                    },
                    onSubscriptionSucceeded(channelName: string) {
                        const owner = ref.get();
                        if (owner) {
                            owner._subscriptions.push(channelName);
                            owner.channelEvents.forEach((event, callback) => {
                                if (
                                    event.channelName === channelName &&
                                    event.event === 'pusher:subscription_succeeded'
                                ) {
                                    callback();
                                }
                            });
                        }
                    },
                    onEvent(ev: com.pusher.client.channel.PusherEvent) {
                    }
                }),
                []
            );
        } else if (channelName.startsWith('presence-')) {
            if (this.android.getPresenceChannel(channelName)) {
                return new TNSPusherChannel(
                    this.android,
                    this.android.getPresenceChannel(channelName),
                    this
                );
            }
            subscription = this.android.subscribePresence(
                channelName,
                {
                    onUsersInformationReceived(
                        param0: string,
                        param1: java.util.Set<com.pusher.client.channel.User>
                    ) {
                    },
                    userSubscribed(
                        param0: string,
                        param1: com.pusher.client.channel.User
                    ) {
                    },
                    userUnsubscribed(
                        param0: string,
                        param1: com.pusher.client.channel.User
                    ) {
                    },
                    onAuthenticationFailure(error: string, param1: java.lang.Exception) {
                        const owner = ref.get();
                        if (owner) {
                            owner.channelEvents.forEach((event, callback) => {
                                if (
                                    event.channelName === channelName &&
                                    event.event === 'pusher:subscription_error'
                                ) {
                                    callback({
                                        channelName,
                                        data: {
                                            code: null,
                                            message: error
                                        }
                                    });
                                }
                            });
                        }
                    },
                    onSubscriptionSucceeded(channelName: string) {
                        const owner = ref.get();
                        if (owner) {
                            owner._subscriptions.push(channelName);
                            owner.channelEvents.forEach((event, callback) => {
                                if (
                                    event.channelName === channelName &&
                                    event.event === 'pusher:subscription_succeeded'
                                ) {
                                    callback();
                                }
                            });
                        }
                    },
                    onEvent(ev: com.pusher.client.channel.PusherEvent) {
                    }
                },
                []
            );
        } else {
            if (this.android.getChannel(channelName)) {
                return new TNSPusherChannel(
                    this.android,
                    this.android.getChannel(channelName),
                    this
                );
            }
            subscription = this.android.subscribe(
                channelName,
                new com.pusher.client.channel.ChannelEventListener({
                    onSubscriptionSucceeded(param0: string) {
                        const owner = ref.get();
                        if (owner) {
                            owner._subscriptions.push(channelName);
                            owner.channelEvents.forEach((event, callback) => {
                                if (
                                    event.channelName === channelName &&
                                    event.event === 'pusher:subscription_succeeded'
                                ) {
                                    callback();
                                }
                            });
                        }
                    },
                    onEvent(ev: com.pusher.client.channel.PusherEvent): void {
                    }
                }),
                []
            );
        }
        return new TNSPusherChannel(this.android, subscription, this);
    }

    unsubscribeAll(): void {
        this._subscriptions.forEach(channelName => {
            this.android.unsubscribe(channelName);
        });
    }

    unsubscribe(channelName: string): void {
        this.android.unsubscribe(channelName);
    }

    bind(callback: Function) {
        this.globalEvents.push(callback);
        return this;
    }

    unbind(callback: Function): void {
        this.globalEvents = this.globalEvents.filter(item => {
            return item !== callback;
        });
    }
}

export class TNSPusherChannel extends TNSPusherChannelBase {
    channel:
        | com.pusher.client.channel.Channel
        | com.pusher.client.channel.PrivateChannel
        | com.pusher.client.channel.PresenceChannel;
    android: com.pusher.client.Pusher;
    ref: TNSPusher;

    constructor(instance: any, channel: any, ref: TNSPusher) {
        super();
        this.android = instance;
        this.channel = channel;
        this.ref = ref;
    }

    get name() {
        return this.channel.getName();
    }

    bind(event: string, callback: Function) {
        let listener;
        const ref = new WeakRef(this.ref);
        if (this.name.startsWith('private-')) {
            listener = new com.pusher.client.channel.PrivateChannelEventListener({
                onAuthenticationFailure(error: string, param1: java.lang.Exception) {
                },
                onSubscriptionSucceeded(param0: string) {
                },
                onEvent(ev: com.pusher.client.channel.PusherEvent) {
                    callback({
                        channelName: ev.getChannelName(),
                        eventName: ev.getEventName(),
                        data: JSON.parse(ev.getData()),
                        userId: ev.getUserId()
                    });
                }
            });
        } else if (this.name.startsWith('presence-')) {
            listener = new com.pusher.client.channel.PresenceChannelEventListener({
                onUsersInformationReceived(
                    param0: string,
                    param1: java.util.Set<com.pusher.client.channel.User>
                ) {
                },
                userSubscribed(
                    param0: string,
                    param1: com.pusher.client.channel.User
                ) {
                },
                userUnsubscribed(
                    param0: string,
                    param1: com.pusher.client.channel.User
                ) {
                },
                onAuthenticationFailure(param0: string, param1: java.lang.Exception) {
                },
                onSubscriptionSucceeded(param0: string) {
                },
                onEvent(ev: com.pusher.client.channel.PusherEvent) {
                    callback({
                        channelName: ev.getChannelName(),
                        eventName: ev.getEventName(),
                        data: JSON.parse(ev.getData()),
                        userId: ev.getUserId()
                    });
                }
            });
        } else {
            listener = new com.pusher.client.channel.ChannelEventListener({
                onSubscriptionSucceeded(param0: string) {
                },
                onEvent(ev: com.pusher.client.channel.PusherEvent): void {
                    callback({
                        channelName: ev.getChannelName(),
                        eventName: ev.getEventName(),
                        data: JSON.parse(ev.getData()),
                        userId: ev.getUserId()
                    });
                }
            });
        }

        this.channel.bind(event, listener);
        this.ref.channelEvents.set(callback, {
            event,
            listener,
            channelName: this.name
        });
    }

    unbind(event: string, callback: Function) {
        const data = this.ref.channelEvents.get(callback);
        if (data) {
            this.channel.unbind(event, data.listener);
            this.ref.channelEvents.delete(callback);
        }
    }

    trigger(event: string, data: any) {
        if (
            this.name &&
            (this.name.startsWith('private-') || this.name.startsWith('presence-'))
        ) {
            let toSend = '';
            if (typeof data === 'object') {
                toSend = JSON.stringify(data);
            } else if (typeof data === 'string') {
                toSend = data;
            }
            if (!event.startsWith('client-')) {
                event = `client-${event}`;
            }
            (this.channel as any).trigger(event, toSend);
        }
    }
}

export class TNSPusherConnection extends TNSPusherConnectionBase {
    android: com.pusher.client.Pusher;
    ref: TNSPusher;
    _state: any;

    constructor(instance: any, ref: TNSPusher) {
        super();
        this.android = instance;
        this.ref = ref;
    }

    bind(event: string, callback: Function) {
        if (event === 'state_change' || event === 'connected') {
            this.ref.connectionEvents.set(callback, {
                event,
                listener: null,
                channelName: null
            });
        } else {
            const listener = new com.pusher.client.connection.ConnectionEventListener(
                {
                    onConnectionStateChange(
                        param0: com.pusher.client.connection.ConnectionStateChange
                    ) {
                    },
                    onError(error: string, code: string, exception: java.lang.Exception) {
                        if (event === 'error') {
                            callback({
                                event,
                                msg: error
                            });
                        }
                    }
                }
            );
            this.android
                .getConnection()
                .bind(com.pusher.client.connection.ConnectionState.ALL, listener);
            this.ref.connectionEvents.set(callback, {
                event,
                listener,
                channelName: null
            });
        }
    }

    unbind(event: string, callback?: Function) {
        const data = this.ref.connectionEvents.get(callback);
        if (data) {
            if (event === 'state_change' || event === 'connected') {
                this.ref.connectionEvents.delete(callback);
                return;
            }
            this.android
                .getConnection()
                .unbind(
                    com.pusher.client.connection.ConnectionState.ALL,
                    data.listener
                );
            this.ref.connectionEvents.delete(callback);
        }
    }

    get state() {
        return this._state;
    }
}
