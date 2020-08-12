"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var enums_1 = require("./enums");
__export(require("./enums"));
var InternalPusherEvents;
(function (InternalPusherEvents) {
    InternalPusherEvents["Error"] = "pusher:error";
    InternalPusherEvents["Ping"] = "pusher:ping";
    InternalPusherEvents["Pong"] = "pusher:pong";
})(InternalPusherEvents = exports.InternalPusherEvents || (exports.InternalPusherEvents = {}));
var TNSPusherBase = (function () {
    function TNSPusherBase() {
    }
    return TNSPusherBase;
}());
exports.TNSPusherBase = TNSPusherBase;
var TNSPusherConnectionBase = (function () {
    function TNSPusherConnectionBase() {
    }
    Object.defineProperty(TNSPusherConnectionBase.prototype, "state", {
        get: function () {
            return enums_1.ConnectionStatus.INITIALIZED;
        },
        enumerable: true,
        configurable: true
    });
    return TNSPusherConnectionBase;
}());
exports.TNSPusherConnectionBase = TNSPusherConnectionBase;
var TNSPusherChannelBase = (function () {
    function TNSPusherChannelBase() {
    }
    return TNSPusherChannelBase;
}());
exports.TNSPusherChannelBase = TNSPusherChannelBase;
//# sourceMappingURL=pusher.common.js.map