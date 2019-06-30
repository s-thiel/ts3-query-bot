'use strict';

/**
 * channelDelete
 * 
 * Deletes an existing channel by ID. If force is set to 1, 
 * the channel will be deleted even if there are clients within.
 * 
 * @param {Number} cid 
 * @param {Number} force 
 * @return {Promise}
 */
async function channeldelete(cid, force = 0) {
    if (!cid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('channeldelete', {
        cid: cid,
        force: force
    });
    return result;
}

module.exports = channeldelete;