var Mutex = require('async-mutex').Mutex;

class ActivityWatcher {
    constructor(server_api, inactive_timeout) {
        this.server_api = server_api;
        this.inactive_timeout = inactive_timeout;
        this.mutex = new Mutex();
        this.enabled = true;
        this.last_activity_action = Date.now();
    }

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }

    async set_inactive_timeout(inactive_timeout) {
        await this.mutex.runExclusive(() => {
            this.inactive_timeout = inactive_timeout;
        });
    }

    async on_did_activity_action(event) {
        await this.mutex.runExclusive(() => {
            this.last_activity_action = Date.now();
        });
    }

    async check_activity() {
        if (!this.enabled) {
            return
        }
        await this.mutex.runExclusive(() => {
            if( Date.now() - this.last_activity_action < this.inactive_timeout) {
                this.server_api.notify_heartbeat(Math.round(this.last_activity_action/1000));
            }
        });
    }

    
}

module.exports = {
    ActivityWatcher
}