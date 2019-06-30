'use strict';

/**
 * clientmessage
 * 
 * @param {Number} clid 
 * @param {String} msg 
 * @return {Promise}
 */
async function clientmessage(clid, msg) {
    if (!clid || !msg)
        throw new Error('ERROR_MISSING_PARAM');

    let result = this.query.send('sendtextmessage', {
        targetmode: 1,
        target: clid,
        msg: msg
    });

    return result;
}

module.exports = clientmessage;