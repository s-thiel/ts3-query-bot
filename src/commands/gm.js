'use strict';

/**
 * gm
 * 
 * Sends a text message to all clients on all virtual servers in the TeamSpeak 3 Server instance.
 * @param {String} msg 
 * @return {Promise}
 */
async function gm(msg) {
    if (!msg)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('gm', {
        msg: msg
    });

    return result;
}

module.exports = gm;