var Mutex = require('async-mutex').Mutex;

class ActivityWatcher {
    constructor(server_api, inactive_timeout) {
        this.server_api = server_api;
        this.inactive_timeout = inactive_timeout;
        this.last_activity_action_mutex = new Mutex();
        this.last_activity_action = Date.now();
    }

    async on_did_activity_action(event) {
        await this.last_activity_action_mutex.runExclusive(() => {
            this.last_activity_action = Date.now();
        });
    }

    async check_activity() {
        await this.last_activity_action_mutex.runExclusive(() => {
            if( Date.now() - this.last_activity_action > this.inactive_timeout) {
                this.server_api.notify_inactive();
            } else {
                this.server_api.notifiy_active();
            }
        });
    }

    
}

module.exports = {
    ActivityWatcher
}