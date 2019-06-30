'use strict';

/**
 * clientpermlist
 * 
 * Displays a list of permissions defined for a client.
 * 
 * @param {Number} cldbid 
 * @return {Promise}
 */
async function clientpermlist(cldbid) {
    if (!cldbid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('clientpermlist', {
        cldbid: cldbid
    });
    return result;
}

module.exports = clientpermlist;