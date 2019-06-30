'use strict';

/**
 * clientKick
 * 
 * Kicks one client specified with clid from currently joined channel or from the server, 
 * depending on reasonid. The reasonmsg parameter specifies a text message sent to the kicked clients. 
 * This parameter is optional and may only have a maximum of 40 characters.
 * 
 * @param {Number} clid 
 * @param {String} msg 
 * @param {Number} reasonid 
 * @return {Promise}
 */
async function clientKick(clid, msg, reasonid = 4) {
    if (!clid || !msg)
        throw new Error('ERROR_MISSING_PARAM');

    if (msg.length > 40 || reasonid < 4 || reasonid > 5)
        throw new Error('ERROR_WRONG_PARAM');

    let result = await this.query.send('clientkick', {
            clid: clid,
            reasonid: reasonid,
            reasonmsg: msg
        });

    return result;
}

module.exports = clientKick;