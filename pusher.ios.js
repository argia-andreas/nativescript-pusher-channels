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
    _this._globalEvents = new Map();
    _this._channelEvents = new Map();
    _this._connectionEvents = new Map();
    _this._delegate = PusherDelegateImpl.initWithOwner(new WeakRef(_this));
    if (options) {
      var authEndpoint = OCAuthMethod.alloc().initWithType(4);
      var authorizer = void 0;
      if (options.authEndpoint) {
        authEndpoint = OCAuthMethod.alloc().initWithAuthEndpoint(
          options.authEndpoint
        );
      }

      // If we have auth header or params, use AuthRequestBuilder
      // Pass a headers object like:
      // {Authorization: "Bearer 12345", Accept: "application/json"}
      // Or query params: {test: '123'}
      if (options.auth && options.authEndpoint) {
        const headers = options.auth.headers;
        const params = options.auth.params;

        var authRequestBuilder = OCMyAuthRequestBuilder.alloc().initWithAuthEndpointAuthHeadersAuthParams(
          options.authEndpoint,
          headers,
          params
        );

        authEndpoint = OCAuthMethod.alloc().initWithAuthRequestBuilder(
          authRequestBuilder
        );
      }

      if (options.authorizer) {
      }
      var host = OCPusherHost.alloc().init();
      if (options.cluster) {
        host = OCPusherHost.alloc().initWithCluster(options.cluster);
      }
      if (options.host) {
        host = OCPusherHost.alloc().initWithHost(options.host);
      }

      var opts = PusherClientOptions.alloc().initWithOcAuthMethodAutoReconnectOcHostPortEncryptedActivityTimeout(
        authEndpoint,
        !!options.autoReconnect,
        host,
        options.port || null,
        !!options.encrypted,
        options.activityTimeout || null
      );
      _this.ios = Pusher.alloc().initWithAppKeyOptions(apiKey, opts);
    } else {
      _this.ios = Pusher.alloc().initWithKey(apiKey);
    }
    _this.ios.delegate = _this._delegate;
    return _this;
  }
  TNSPusher.prototype.connect = function () {
    this.ios.connect();
  };
  TNSPusher.prototype.disconnect = function () {
    this.ios.disconnect();
  };
  Object.defineProperty(TNSPusher.prototype, "connection", {
    get: function () {
      if (!this._connection) {
        this._connection = new TNSPusherConnection(this.ios, new WeakRef(this));
      }
      return this._connection;
    },
    enumerable: true,
    configurable: true,
  });
  TNSPusher.prototype.bind = function (callback) {
    var id = this.ios.bindWithEventCallback(function (ev) {
      if (!ev) {
        return;
      }
      var channelName = reader.readProp(ev, "channelName", interop.types.id);
      var eventName = reader.readProp(ev, "eventName", interop.types.id);
      var data = reader.readProp(ev, "data", interop.types.id);
      var userId = reader.readProp(ev, "userId", interop.types.id);
      callback({
        channelName: channelName,
        data: JSON.parse(data),
        eventName: eventName,
        userId: userId,
      });
    });
    this._globalEvents.set(callback, id);
    return this;
  };
  TNSPusher.prototype.unbind = function (callback) {
    var id = this._globalEvents.get(callback);
    if (id) {
      this.ios.unbindWithCallbackId(id);
      this._globalEvents.delete(callback);
    }
  };
  TNSPusher.prototype.subscribe = function (event) {
    var channel;
    if (
      this.ios &&
      this.ios.connection &&
      this.ios.connection.channels &&
      this.ios.connection.channels.findWithName
    ) {
      channel = this.ios.connection.channels.findWithName(event);
    }
    if (!channel) {
      channel = this.ios.subscribeWithChannelNameOnMemberAddedOnMemberRemoved(
        event,
        function (p1) {},
        function (p1) {}
      );
    }
    return new TNSPusherChannel(this.ios, channel, new WeakRef(this));
  };
  TNSPusher.prototype.unsubscribeAll = function () {
    this.ios.unsubscribeAll();
  };
  TNSPusher.prototype.unsubscribe = function (channelName) {
    this.ios.unsubscribe(channelName);
  };
  return TNSPusher;
})(pusher_common_1.TNSPusherBase);
exports.TNSPusher = TNSPusher;
var TNSPusherChannel = (function (_super) {
  __extends(TNSPusherChannel, _super);
  function TNSPusherChannel(instance, channel, ref) {
    var _this = _super.call(this) || this;
    _this.ios = instance;
    _this.channel = channel;
    _this.ref = ref;
    return _this;
  }
  Object.defineProperty(TNSPusherChannel.prototype, "name", {
    get: function () {
      return this.channel.name;
    },
    enumerable: true,
    configurable: true,
  });
  TNSPusherChannel.prototype.trigger = function (event, data) {
    if (
      this.name &&
      (this.name.startsWith("private-") || this.name.startsWith("presence-"))
    ) {
      if (!event.startsWith("client-")) {
        event = "client-" + event;
      }
      this.channel.triggerWithEventNameData(event, data);
    }
  };
  TNSPusherChannel.prototype.bind = function (event, callback) {
    var id = this.channel.bindWithEventNameEventCallback(event, function (ev) {
      if (!ev) {
        return;
      }
      var channelName = reader.readProp(ev, "channelName", interop.types.id);
      var eventName = reader.readProp(ev, "eventName", interop.types.id);
      var data = reader.readProp(ev, "data", interop.types.id);
      var userId = reader.readProp(ev, "userId", interop.types.id);
      callback({
        channelName: channelName,
        data: JSON.parse(data),
        eventName: eventName,
        userId: userId,
      });
    });
    var owner = this.ref && this.ref.get();
    if (owner) {
      owner._channelEvents.set(callback, {
        id: id,
        event: event,
        channelName: this.channel.name,
      });
    }
  };
  TNSPusherChannel.prototype.unbind = function (event, callback) {
    var owner = this.ref && this.ref.get();
    if (owner) {
      var data = owner._channelEvents.get(callback);
      if (data) {
        this.ios.unbindWithCallbackId(data.id);
        owner._channelEvents.delete(callback);
      }
    }
  };
  return TNSPusherChannel;
})(pusher_common_1.TNSPusherChannelBase);
exports.TNSPusherChannel = TNSPusherChannel;
var TNSPusherConnection = (function (_super) {
  __extends(TNSPusherConnection, _super);
  function TNSPusherConnection(instance, ref) {
    var _this = _super.call(this) || this;
    _this.ios = instance;
    _this.ref = ref;
    return _this;
  }
  TNSPusherConnection.prototype.bind = function (event, callback) {
    var owner = this.ref.get();
    if (event === "state_change" || event === "connected") {
      var id = NSUUID.UUID().UUIDString;
      owner._connectionEvents.set(callback, { event: event, id: id });
    } else {
      var id_1 = this.ios.bindWithEventCallback(function (ev) {
        if (ev) {
          var channelName = reader.readProp(
            ev,
            "channelName",
            interop.types.id
          );
          var eventName = reader.readProp(ev, "eventName", interop.types.id);
          var data = reader.readProp(ev, "data", interop.types.id);
          var userId = reader.readProp(ev, "userId", interop.types.id);
          if (
            event === "error" &&
            eventName === pusher_common_1.InternalPusherEvents.Error
          ) {
            callback({
              channelName: channelName,
              data: JSON.parse(data),
            });
            owner._connectionEvents.set(callback, { event: event, id: id_1 });
          }
          if (
            event === "ping" &&
            eventName === pusher_common_1.InternalPusherEvents.Ping
          ) {
            callback("ping");
            owner._connectionEvents.set(callback, { event: event, id: id_1 });
          }
          if (
            event === "pong" &&
            eventName === pusher_common_1.InternalPusherEvents.Pong
          ) {
            callback("pong");
            owner._connectionEvents.set(callback, { event: event, id: id_1 });
          }
        }
      });
    }
  };
  TNSPusherConnection.prototype.unbind = function (event, callback) {
    var owner = this.ref.get();
    if (owner) {
      var data = owner._connectionEvents.get(callback);
      if (data) {
        this.ios.unbindWithCallbackId(data.id);
        owner._connectionEvents.delete(callback);
      }
    }
  };
  Object.defineProperty(TNSPusherConnection.prototype, "state", {
    get: function () {
      return this._state;
    },
    enumerable: true,
    configurable: true,
  });
  return TNSPusherConnection;
})(pusher_common_1.TNSPusherConnectionBase);
exports.TNSPusherConnection = TNSPusherConnection;
var PusherDelegateImpl = (function (_super) {
  __extends(PusherDelegateImpl, _super);
  function PusherDelegateImpl() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  PusherDelegateImpl_1 = PusherDelegateImpl;
  PusherDelegateImpl.initWithOwner = function (owner) {
    var delegate = PusherDelegateImpl_1.new();
    delegate._owner = owner;
    return delegate;
  };
  PusherDelegateImpl._getState = function (state) {
    switch (state) {
      case 1:
        return enums_1.ConnectionStatus.CONNECTED;
      case 0:
        return enums_1.ConnectionStatus.CONNECTING;
      case 2:
        return enums_1.ConnectionStatus.DISCONNECTING;
      case 4:
        return enums_1.ConnectionStatus.RECONNECTING;
      default:
        return enums_1.ConnectionStatus.DISCONNECTED;
    }
  };
  PusherDelegateImpl.prototype.changedConnectionStateFromTo = function (
    old,
    new_
  ) {
    var owner = this._owner.get();
    if (owner) {
      var current_1 = PusherDelegateImpl_1._getState(new_);
      var previous_1 = PusherDelegateImpl_1._getState(old);
      owner.connection._state = current_1;
      var didConnect_1 = (old === 0 && new_ === 1) || (old === 4 && new_ === 1);
      owner._connectionEvents.forEach(function (data, callback) {
        if (data.event === "connected" && didConnect_1) {
          callback();
        }
        if (data.event === "state_change") {
          callback({
            previous: previous_1,
            current: current_1,
          });
        }
      });
    }
  };
  PusherDelegateImpl.prototype.debugLogWithMessage = function (message) {};
  PusherDelegateImpl.prototype.failedToSubscribeToChannelWithNameResponseDataError = function (
    name,
    response,
    data,
    error
  ) {
    var owner = this._owner.get();
    if (owner) {
      owner._channelEvents.forEach(function (event, callback) {
        if (
          event.channelName === name &&
          event.event === "pusher:subscription_error"
        ) {
          callback({
            channelName: name,
            data: JSON.parse(data),
          });
        }
      });
    }
  };
  PusherDelegateImpl.prototype.subscribedToChannelWithName = function (name) {
    var owner = this._owner.get();
    if (owner) {
      owner._channelEvents.forEach(function (event, callback) {
        if (
          event.channelName === name &&
          event.event === "pusher:subscription_succeeded"
        ) {
          callback();
        }
      });
    }
  };
  var PusherDelegateImpl_1;
  PusherDelegateImpl = PusherDelegateImpl_1 = __decorate(
    [ObjCClass(PusherDelegate)],
    PusherDelegateImpl
  );
  return PusherDelegateImpl;
})(NSObject);
var NativePropertyReader = (function () {
  function NativePropertyReader() {
    this._invocationCache = new Map();
  }
  NativePropertyReader.prototype.getInvocationObject = function (
    object,
    selector
  ) {
    var invocation = this._invocationCache.get(selector);
    if (!invocation) {
      var sig = object.methodSignatureForSelector(selector);
      invocation = NSInvocation.invocationWithMethodSignature(sig);
      invocation.selector = selector;
      this._invocationCache[selector] = invocation;
    }
    return invocation;
  };
  NativePropertyReader.prototype.readProp = function (object, prop, type) {
    var invocation = this.getInvocationObject(object, prop);
    invocation.invokeWithTarget(object);
    var ret = new interop.Reference(type, new interop.Pointer());
    invocation.getReturnValue(ret);
    return ret.value;
  };
  return NativePropertyReader;
})();
var reader = new NativePropertyReader();
//# sourceMappingURL=pusher.ios.js.map
