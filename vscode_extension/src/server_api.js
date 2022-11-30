const fetch = require('node-fetch');

class ServerAPI {
    constructor(server_url, user, pass) {
        this.set_server_url(server_url);
        this.set_credentials(user, pass);
        this.connectivity_status = false;
    }

    set_server_url(server_url) {
        this.server_url = server_url;
    }

    set_credentials(user, pass) {
        this.auth_header = "Basic " + Buffer.from(user + ":" + pass).toString("base64");
    }

    _post_update_with_json(json_data) {
        return new Promise((resolve, reject) => {
            try {
                return fetch(new URL("update", this.server_url), {
                    method: "POST",
                    body: JSON.stringify(json_data),
                    headers: { "Content-Type": "application/json", "Authorization": this.auth_header }
                }).then((response) => {
                    this.connectivity_status = response.ok;
                    if (response.ok) {
                        resolve();
                    } else {
                        reject();
                    }
                }).catch((reason) => {
                    this.connectivity_status = false;
                    reject(reason);
                });
            } catch (error) {
                this.connectivity_status = false;
                reject(error);
            }
        });
    }

    post_update(data) {
        return this._post_update_with_json(data);
    }
}

module.exports = {
    ServerAPI
}