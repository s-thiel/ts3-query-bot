'use strict';

/**
 * clientmove
 * 
 * Moves one or more clients specified with clid to the channel with ID cid.
 * If the target channel has a password, it needs to be specified with cpw. 
 * If the channel has no password, the parameter can be omitted.
 * 
 * @param {Number} clid 
 * @param {Number} cid 
 * @return {Promise}
 */
async function clientmove(clid, cid) {
    if (!clid || !cid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('clientmove', {
        clid: clid,
        cid: cid
    });

    return result;
}

module.exports = clientmove;