"use strict";

function RoonApiStatus(roon, opts) {
    this._svc = roon.register_service("com.roonlabs.status:1", {
        subscriptions: [
            {
                subscribe_name:   "subscribe_status",
                unsubscribe_name: "unsubscribe_status",
                start: (req) => {
                    req.send_continue("Subscribed", { message: this._message, is_error: this._is_error });
                }
            }
        ],
        methods: {
            get_status: (req) => {
                req.send_complete("Success", { message: this._message, is_error: this._is_error });
            }
        }
    });

    this.services = [ this._svc ];
    this._message  = null;
    this._is_error = null;
};

RoonApiStatus.prototype.set_status = function(message, is_error) {
    this._message  = message;
    this._is_error = is_error;
    this._svc.send_continue_all('subscribe_status', "Changed", { message: this._message, is_error: this._is_error });
};

exports = module.exports = RoonApiStatus;
