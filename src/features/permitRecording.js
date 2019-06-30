'use strict';

class permitRecording {
    constructor(query) {
        this._query = query;
        this._interval;
        this._timeout;
        this._msg;
    }

    async start(msg = 'Recording is not allowed.', interval = 5000) {
        this._msg = msg;
        this._interval = interval;
        this._check();
    }

    stop() {
        clearTimeout(this._interval);
        this._interval;
        this._timeout;
    }

    async _check() {
        try {
            let clients = await this._query.clientlist();
            for(let client of clients.default) {
                if(parseInt(client.client_is_recording, 10) == 1)
                    this._query.clientkick(client.clid, this._msg, 5);
            }

            this._timeout = setTimeout(async () => {
                await this._check();
            }, this._interval);
        } catch (error) {
            this._query._log(error);
            this._timeout = setTimeout(async () => {
                await this._check();
            }, this._interval);
        }
    }
}

module.exports = permitRecording;