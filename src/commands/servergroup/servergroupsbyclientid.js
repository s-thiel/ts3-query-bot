'use strict';

/**
 * servergroupsbyclientid
 * 
 * Displays all server groups the client specified with cldbid is currently residing in.
 * 
 * @param {Number} cldbid
 * @return {Promise}
 */
async function servergroupsbyclientid(cldbid) {
        if (!cldbid)
            throw new Error('ERROR_MISSING_PARAM');

        let result = await this.query.send('servergroupsbyclientid', {
            cldbid: cldbid
        });

        return result;
}

module.exports = servergroupsbyclientid;