'use strict';

/**
 * clientgetnamefromuid
 * 
 * Displays the database ID and nickname matching the unique identifier specified by cluid
 *
 * @param {Number} cluid 
 */
async function clientgetnamefromuid(cluid) {
    if (!cluid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('clientgetnamefromuid', {
        cluid: cluid
    });

    return result;
}

module.exports = clientgetnamefromuid;