'use strict';

class welcome {
    /**
     * 
     * @param {*} query 
     */
    constructor(query) {
        this._query = query;
        this._msg;
        this._type;
        this._eventHandler = this.eventHandler.bind(this);
    }

    /**
     * 
     * @param {*} msg 
     * @param {*} type 
     */
    start(msg, type = 0) {
        this._type = type;
        this._msg = msg;
        this._query.on('cliententerview', this._eventHandler);
    }

    /**
     * 
     * @param {*} client 
     */
    eventHandler(client) {
        if(!this._type)
            this._query.clientmessage(client.clid, this._msg);
        else
            this._query.clientpoke(client.clid, this._msg);
    }

    /**
     * 
     */
    stop() {
        this._query.removeListener('cliententerview', this._eventHandler);
    }
}

module.exports = welcome;