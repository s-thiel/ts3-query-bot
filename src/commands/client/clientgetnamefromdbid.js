'use strict';

/**
 * clientgetnamefromdbid
 * 
 * Displays the unique identifier and nickname matching the database ID specified by cldbid.
 *
 * @param {Number} cldbid 
 */
async function clientgetnamefromdbid(cldbid) {
    if (!cldbid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('clientgetnamefromdbid', {
        cldbid: cldbid
    });

    return result;
}

module.exports = clientgetnamefromdbid;