'use strict';

/**
 * clientgetdbidfromuid
 * 
 * Displays the database ID matching the unique identifier specified by cluid.
 *
 * @param {Number} cluid 
 */
async function clientgetdbidfromuid(cluid) {
    if (!cluid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('clientgetdbidfromuid', {
        cluid: cluid
    });

    return result;
}

module.exports = clientgetdbidfromuid;