const fetch = require('node-fetch');

class ServerAPI {
    constructor(server_url, user, pass) {
        this.server_url = server_url;
        this.auth_header = "Bearer " + user + ":" + pass;
        this.connectivity_status = false;
    }

    update_connectivity_status_from_response(response) {
        this.connectivity_status = response.ok;
    }

    notifiy_active() {
        fetch(new URL("update", this.server_url), {
            method: "POST",
            body: JSON.stringify({status: "active"}),
            headers: {"Content-Type": "application/json", "Authorization": this.auth_header}
        }).then(this.update_connectivity_status_from_response)
    }

    notifiy_inactive() {
        fetch(new URL("update", this.server_url), {
            method: "POST",
            body: JSON.stringify({status: "incative"}),
            headers: {"Content-Type": "application/json", "Authorization": this.auth_header}
        }).then(this.update_connectivity_status_from_response);
    }


}

module.exports = {
    ServerAPI
}