"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var pusher_common_1 = require("./pusher.common");
var enums_1 = require("./enums");
__export(require("./enums"));
var TNSPusher = (function (_super) {
    __extends(TNSPusher, _super);
    function TNSPusher(apiKey, options) {
        var _this = _super.call(this) || this;
        _this.connectionEvents = new Map();
        _this.channelEvents = new Map();
        _this.globalEvents = [];
        _this._subscriptions = [];
        if (options) {
            var opts = new com.pusher.client.PusherOptions();
            if (options.activityTimeout) {
                opts.setActivityTimeout(options.activityTimeout);
            }
            var authorizer = null;
            if (options.authEndpoint) {
                var endpoint_1 = options.authEndpoint;
                if (options.auth && options.auth.params) {
                    Object.keys(options.auth.params).forEach(function (key, index) {
                        var val = options.auth.params[key];
                        if (index === 0) {
                            endpoint_1 = endpoint_1 + "?" + key + "=" + val;
                        }
                        else {
                            endpoint_1 = endpoint_1 + "&" + key + "=" + val;
                        }
                    });
                }
                authorizer = new com.pusher.client.util.HttpAuthorizer(endpoint_1);
            }
            if (authorizer instanceof com.pusher.client.util.HttpAuthorizer && options.auth && options.auth.headers) {
                var headers_1 = new java.util.HashMap();
                Object.keys(options.auth.headers).forEach(function (key) {
                    var val = options.auth.headers[key];
                    headers_1.put(key, val);
                });
                authorizer.setHeaders(headers_1);
            }
            if (options.authorizer) {
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
            _this.android = new com.pusher.client.Pusher(apiKey, opts);
        }
        else {
            _this.android = new com.pusher.client.Pusher(apiKey);
        }
        return _this;
    }
    TNSPusher.getConnectionStatus = function (status) {
        switch (status) {
            case com.pusher.client.connection.ConnectionState.CONNECTED:
                return enums_1.ConnectionStatus.CONNECTED;
            case com.pusher.client.connection.ConnectionState.CONNECTING:
                return enums_1.ConnectionStatus.CONNECTING;
            case com.pusher.client.connection.ConnectionState.DISCONNECTED:
                return enums_1.ConnectionStatus.DISCONNECTED;
            case com.pusher.client.connection.ConnectionState.DISCONNECTING:
                return enums_1.ConnectionStatus.DISCONNECTING;
            default:
                return enums_1.ConnectionStatus.RECONNECTING;
        }
    };
    Object.defineProperty(TNSPusher.prototype, "connection", {
        get: function () {
            if (!this._connection) {
                this._connection = new TNSPusherConnection(this.android, this);
            }
            return this._connection;
        },
        enumerable: true,
        configurable: true
    });
    TNSPusher.prototype.connect = function () {
        var ref = new WeakRef(this);
        this.android.connect(new com.pusher.client.connection.ConnectionEventListener({
            onConnectionStateChange: function (state) {
                var owner = ref.get();
                if (owner) {
                    var current_1 = TNSPusher.getConnectionStatus(state.getCurrentState());
                    var previous_1 = TNSPusher.getConnectionStatus(state.getPreviousState());
                    owner.connection._state = current_1;
                    var didConnect_1 = (previous_1 === enums_1.ConnectionStatus.CONNECTING &&
                        current_1 === enums_1.ConnectionStatus.CONNECTED) ||
                        (previous_1 === enums_1.ConnectionStatus.RECONNECTING &&
                            current_1 === enums_1.ConnectionStatus.CONNECTED);
                    owner.connectionEvents.forEach(function (ev, callback) {
                        if (ev.event === 'state_change') {
                            callback({
                                previous: previous_1,
                                current: current_1
                            });
                        }
                        if (ev.event === 'connected' && didConnect_1) {
                            callback();
                        }
                    });
                }
            },
            onError: function (error, code, exception) {
            }
        }), [com.pusher.client.connection.ConnectionState.ALL]);
    };
    TNSPusher.prototype.disconnect = function () {
        this.android.disconnect();
    };
    TNSPusher.prototype.subscribe = function (channelName) {
        var subscription;
        var ref = new WeakRef(this);
        if (channelName.startsWith('private-')) {
            if (this.android.getPrivateChannel(channelName)) {
                return new TNSPusherChannel(this.android, this.android.getPrivateChannel(channelName), this);
            }
            subscription = this.android.subscribePrivate(channelName, new com.pusher.client.channel.PrivateChannelEventListener({
                onAuthenticationFailure: function (error, param1) {
                    var owner = ref.get();
                    if (owner) {
                        owner.channelEvents.forEach(function (event, callback) {
                            if (event.channelName === channelName &&
                                event.event === 'pusher:subscription_error') {
                                callback({
                                    channelName: channelName,
                                    data: {
                                        code: null,
                                        message: error
                                    }
                                });
                            }
                        });
                    }
                },
                onSubscriptionSucceeded: function (channelName) {
                    var owner = ref.get();
                    if (owner) {
                        owner._subscriptions.push(channelName);
                        owner.channelEvents.forEach(function (event, callback) {
                            if (event.channelName === channelName &&
                                event.event === 'pusher:subscription_succeeded') {
                                callback();
                            }
                        });
                    }
                },
                onEvent: function (ev) {
                }
            }), []);
        }
        else if (channelName.startsWith('presence-')) {
            if (this.android.getPresenceChannel(channelName)) {
                return new TNSPusherChannel(this.android, this.android.getPresenceChannel(channelName), this);
            }
            subscription = this.android.subscribePresence(channelName, {
                onUsersInformationReceived: function (param0, param1) {
                },
                userSubscribed: function (param0, param1) {
                },
                userUnsubscribed: function (param0, param1) {
                },
                onAuthenticationFailure: function (error, param1) {
                    var owner = ref.get();
                    if (owner) {
                        owner.channelEvents.forEach(function (event, callback) {
                            if (event.channelName === channelName &&
                                event.event === 'pusher:subscription_error') {
                                callback({
                                    channelName: channelName,
                                    data: {
                                        code: null,
                                        message: error
                                    }
                                });
                            }
                        });
                    }
                },
                onSubscriptionSucceeded: function (channelName) {
                    var owner = ref.get();
                    if (owner) {
                        owner._subscriptions.push(channelName);
                        owner.channelEvents.forEach(function (event, callback) {
                            if (event.channelName === channelName &&
                                event.event === 'pusher:subscription_succeeded') {
                                callback();
                            }
                        });
                    }
                },
                onEvent: function (ev) {
                }
            }, []);
        }
        else {
            if (this.android.getChannel(channelName)) {
                return new TNSPusherChannel(this.android, this.android.getChannel(channelName), this);
            }
            subscription = this.android.subscribe(channelName, new com.pusher.client.channel.ChannelEventListener({
                onSubscriptionSucceeded: function (param0) {
                    var owner = ref.get();
                    if (owner) {
                        owner._subscriptions.push(channelName);
                        owner.channelEvents.forEach(function (event, callback) {
                            if (event.channelName === channelName &&
                                event.event === 'pusher:subscription_succeeded') {
                                callback();
                            }
                        });
                    }
                },
                onEvent: function (ev) {
                }
            }), []);
        }
        return new TNSPusherChannel(this.android, subscription, this);
    };
    TNSPusher.prototype.unsubscribeAll = function () {
        var _this = this;
        this._subscriptions.forEach(function (channelName) {
            _this.android.unsubscribe(channelName);
        });
    };
    TNSPusher.prototype.unsubscribe = function (channelName) {
        this.android.unsubscribe(channelName);
    };
    TNSPusher.prototype.bind = function (callback) {
        this.globalEvents.push(callback);
        return this;
    };
    TNSPusher.prototype.unbind = function (callback) {
        this.globalEvents = this.globalEvents.filter(function (item) {
            return item !== callback;
        });
    };
    return TNSPusher;
}(pusher_common_1.TNSPusherBase));
exports.TNSPusher = TNSPusher;
var TNSPusherChannel = (function (_super) {
    __extends(TNSPusherChannel, _super);
    function TNSPusherChannel(instance, channel, ref) {
        var _this = _super.call(this) || this;
        _this.android = instance;
        _this.channel = channel;
        _this.ref = ref;
        return _this;
    }
    Object.defineProperty(TNSPusherChannel.prototype, "name", {
        get: function () {
            return this.channel.getName();
        },
        enumerable: true,
        configurable: true
    });
    TNSPusherChannel.prototype.bind = function (event, callback) {
        var listener;
        var ref = new WeakRef(this.ref);
        if (this.name.startsWith('private-')) {
            listener = new com.pusher.client.channel.PrivateChannelEventListener({
                onAuthenticationFailure: function (error, param1) {
                },
                onSubscriptionSucceeded: function (param0) {
                },
                onEvent: function (ev) {
                    callback({
                        channelName: ev.getChannelName(),
                        eventName: ev.getEventName(),
                        data: JSON.parse(ev.getData()),
                        userId: ev.getUserId()
                    });
                }
            });
        }
        else if (this.name.startsWith('presence-')) {
            listener = new com.pusher.client.channel.PresenceChannelEventListener({
                onUsersInformationReceived: function (param0, param1) {
                },
                userSubscribed: function (param0, param1) {
                },
                userUnsubscribed: function (param0, param1) {
                },
                onAuthenticationFailure: function (param0, param1) {
                },
                onSubscriptionSucceeded: function (param0) {
                },
                onEvent: function (ev) {
                    callback({
                        channelName: ev.getChannelName(),
                        eventName: ev.getEventName(),
                        data: JSON.parse(ev.getData()),
                        userId: ev.getUserId()
                    });
                }
            });
        }
        else {
            listener = new com.pusher.client.channel.ChannelEventListener({
                onSubscriptionSucceeded: function (param0) {
                },
                onEvent: function (ev) {
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
            event: event,
            listener: listener,
            channelName: this.name
        });
    };
    TNSPusherChannel.prototype.unbind = function (event, callback) {
        var data = this.ref.channelEvents.get(callback);
        if (data) {
            this.channel.unbind(event, data.listener);
            this.ref.channelEvents.delete(callback);
        }
    };
    TNSPusherChannel.prototype.trigger = function (event, data) {
        if (this.name &&
            (this.name.startsWith('private-') || this.name.startsWith('presence-'))) {
            var toSend = '';
            if (typeof data === 'object') {
                toSend = JSON.stringify(data);
            }
            else if (typeof data === 'string') {
                toSend = data;
            }
            if (!event.startsWith('client-')) {
                event = "client-" + event;
            }
            this.channel.trigger(event, toSend);
        }
    };
    return TNSPusherChannel;
}(pusher_common_1.TNSPusherChannelBase));
exports.TNSPusherChannel = TNSPusherChannel;
var TNSPusherConnection = (function (_super) {
    __extends(TNSPusherConnection, _super);
    function TNSPusherConnection(instance, ref) {
        var _this = _super.call(this) || this;
        _this.android = instance;
        _this.ref = ref;
        return _this;
    }
    TNSPusherConnection.prototype.bind = function (event, callback) {
        if (event === 'state_change' || event === 'connected') {
            this.ref.connectionEvents.set(callback, {
                event: event,
                listener: null,
                channelName: null
            });
        }
        else {
            var listener = new com.pusher.client.connection.ConnectionEventListener({
                onConnectionStateChange: function (param0) {
                },
                onError: function (error, code, exception) {
                    if (event === 'error') {
                        callback({
                            event: event,
                            msg: error
                        });
                    }
                }
            });
            this.android
                .getConnection()
                .bind(com.pusher.client.connection.ConnectionState.ALL, listener);
            this.ref.connectionEvents.set(callback, {
                event: event,
                listener: listener,
                channelName: null
            });
        }
    };
    TNSPusherConnection.prototype.unbind = function (event, callback) {
        var data = this.ref.connectionEvents.get(callback);
        if (data) {
            if (event === 'state_change' || event === 'connected') {
                this.ref.connectionEvents.delete(callback);
                return;
            }
            this.android
                .getConnection()
                .unbind(com.pusher.client.connection.ConnectionState.ALL, data.listener);
            this.ref.connectionEvents.delete(callback);
        }
    };
    Object.defineProperty(TNSPusherConnection.prototype, "state", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    return TNSPusherConnection;
}(pusher_common_1.TNSPusherConnectionBase));
exports.TNSPusherConnection = TNSPusherConnection;
//# sourceMappingURL=pusher.android.js.map