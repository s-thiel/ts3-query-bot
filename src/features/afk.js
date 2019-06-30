'use strict';

class afkMover {
    constructor(query) {
        this._query = query;
        this._interval;
        this._afkChannelId;
        this._channelsToWatch;
        this._users = {};
        this._channels = {};
        this._timeout;
    }

    /**
     * 
     * @param {*} afkChannelId 
     * @param {*} channelsToWatch 
     * @param {*} interval 
     */
    async start(afkChannelId, channelsToWatch = [], interval = 5000) {
        if (!afkChannelId)
            throw new Error('Error: invalid channelID');

        this._interval = interval;
        this._afkChannelId = afkChannelId;
        this._channelsToWatch = channelsToWatch;

        try {
            await this._query.channelinfo(this._afkChannelId);
        } catch (error) {
            throw new Error(error.msg);
        }

        for (let channel of this._channelsToWatch)
            this._channels[channel] = true;

        this._check();
    }

    /**
     * 
     */
    stop() {
        clearTimeout(this._interval);
        this._interval;
        this._afkChannelId;
        this._channelsToWatch;
        this._users = {};
        this._channels = {};
        this._timeout;
    }

    /**
     * 
     */
    async _check() {
        try {
            let clients = await this._query.clientlist();
            
            for (let client of clients.default) {
                let {
                    client_unique_identifier,
                    clid,
                    cid,
                    client_away,
                    client_output_muted
                } = client;

                if (client_unique_identifier === 'serveradmin')
                    continue;

                client_away = parseInt(client_away, 10);
                client_output_muted = parseInt(client_output_muted, 10);

                if (this._users[clid] && cid != this._afkChannelId) {
                    delete this._users[clid];
                }

                if (this._users[clid]) {
                    if (!client_away && !client_output_muted) {
                        let cid = this._users[clid]
                        delete this._users[clid];
                        await this._query.clientmove(clid, cid);
                    }
                } else {
                    if ((!this._channelsToWatch.length || this._channels[cid]) && (client_away || client_output_muted) && cid != this._afkChannelId) {
                        this._users[clid] = cid;
                        await this._query.clientmove(clid, this._afkChannelId);
                    }
                }
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

module.exports = afkMover;