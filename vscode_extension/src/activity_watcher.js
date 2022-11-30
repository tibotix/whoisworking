var Mutex = require('async-mutex').Mutex;

class ActivityWatcher {
    constructor(server_api, inactive_timeout) {
        this.server_api = server_api;
        this.inactive_timeout = inactive_timeout;
        this.last_activity_action = Date.now();
        this.break_time = Date.now();
        this.mutex = new Mutex();
        this.enabled = true;
        this.message = "";
    }

    set_enabled(is_enabled) {
        return this.mutex.runExclusive(() => {
            this.enabled = is_enabled;
        });
    }

    set_message(message) {
        return this.mutex.runExclusive(() => {
            this.message = message;
        });
    }

    set_break_time(break_time) {
        return this.mutex.runExclusive(() => {
            this.break_time = break_time;
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
            last_activity_action: Math.round(this.last_activity_action / 1000),
            break_time: Math.round(this.break_time / 1000)
        };
        if (this.message !== "") {
            data["message"] = this.message;
        }
        return data;
    }

    check_activity() {
        return new Promise((resolve, reject) => {
            if (!this.enabled) {
                resolve();
                return;
            }
            this.mutex.runExclusive(() => {
                if (Date.now() - this.last_activity_action < this.inactive_timeout) {
                    this.server_api.post_update(this.build_data());
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