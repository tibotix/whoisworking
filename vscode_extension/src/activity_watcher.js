var Mutex = require('async-mutex').Mutex;

class ActivityWatcher {
    constructor(server_api, inactive_timeout) {
        this.server_api = server_api;
        this.inactive_timeout = inactive_timeout;
        this.mutex = new Mutex();
        this.enabled = true;
        this.last_activity_action = Date.now();
        this.inactive_delay = 0;
        this.message = "";
    }

    disable() {
        return this.mutex.runExclusive(() => {
            this.enabled = false;
        });
    }

    enable() {
        return this.mutex.runExclusive(() => {
            this.enabled = true;
        });
    }

    set_message(message) {
        return this.mutex.runExclusive(() => {
            this.message = message;
        });
    }

    add_inactive_delay(inactive_delay) {
        return new Promise((resolve, reject) => {
            this.mutex.runExclusive(() => {
                this.inactive_delay = Math.max(0, this.inactive_delay+inactive_delay);
            }).then((_) => {
                resolve(this.inactive_delay);
            });
        });
    }

    set_inactive_delay(inactive_delay) {
        return this.mutex.runExclusive(() => {
            this.inactive_delay = inactive_delay;
        });
    }

    set_inactive_timeout(inactive_timeout) {
        return this.mutex.runExclusive(() => {
            this.inactive_timeout = inactive_timeout;
        });
    }

    on_did_activity_action() {
        return this.mutex.runExclusive(() => {
            this.last_activity_action = Date.now();
        });
    }

    build_data() {
        const data = {
            last_activity_action: Math.round(this.last_activity_action/1000)
        };
        if (this.message !== ""){
            data["message"] = this.message;
        }
        return data;
    }

    check_activity() {
        return new Promise((resolve, reject) => {
            if (!this.enabled) {
                resolve();
            }
            this.mutex.runExclusive(() => {
                if( Date.now() - this.last_activity_action < this.inactive_timeout) {
                    this.server_api.notify_heartbeat(this.build_data());
                }
            }).then((_) => {
                resolve();
            });
        });
    }

    
}

module.exports = {
    ActivityWatcher
}