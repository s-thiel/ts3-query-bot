'use strict';

/**
 * clientinfo
 * 
 * returns client information
 * @param {Number} clid 
 * @return {Promise}
 */
async function clientinfo(clid) {
    if (!clid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('clientinfo', {
        clid: clid
    });

    return result;
}

module.exports = clientinfo;