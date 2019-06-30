'use strict';

/**
 * banClient
 * 
 * Bans the client specified with ID clid from the server. 
 * Please note that this will create two separate ban rules for 
 * the targeted clients IP address and his unique identifier.
 * 
 * @param {Number} clid
 * @param {Number} time
 * @param {String} msg
 * @return {Promise}
 */
async function banClient(clid, time, msg) {
    if (!clid)
        throw new Error('ERROR_MISSING_PARAM');

    let props = {
        clid: clid,
    };

    if (time)
        props.time = time;

    if (msg)
        props.msg = msg;

    let result = await this.query.send('banclient', props);
    return result;
}

module.exports = banClient;