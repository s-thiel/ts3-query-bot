'use strict';

/**
 * clientPoke
 * 
 * @param {Number} clid 
 * @param {String} msg 
 * @return {Promise}
 */
async function clientPoke(clid, msg) {
    if (!clid || !msg)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('clientpoke', {
        clid: clid,
        msg: msg
    });

    return result;
}

module.exports = clientPoke;