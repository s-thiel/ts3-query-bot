'use strict';

/**
 * channelMove
 * 
 * Moves a channel to a new parent channel with the ID cpid. 
 * If order is specified, the channel will be sorted right
 * under the channel with the specified ID. 
 * If order is set to 0, the channel will be sorted right below the new parent.
 * 
 * @param {Number} cid 
 * @param {Number} cpid 
 * @param {Number} order 
 */
async function channelmove(cid, cpid, order = 0) {
    if (!cid || !cpid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('channelmove', {
        cid: cid,
        cpid: cpid,
        order: order
    });

    return result;
}

module.exports = channelmove;