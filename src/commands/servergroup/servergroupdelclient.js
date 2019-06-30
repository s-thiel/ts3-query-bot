'use strict';

/**
 * servergroupDelClient
 * 
 * Removes a client from the server group specified with sgid.
 * 
 * @param {Number} cluid 
 * @param {Number} sgid 
 * @return {Promise}
 */
async function servergroupdelclient(cluid, sgid) {
    if (!cluid || !sgid)
        throw new Error('ERROR_MISSING_PARAM');

    let client = await this.clientgetdbidfromuid(cluid);

    if (!client.cldbid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('servergroupdelclient', {
        cldbid: client.cldbid,
        sgid: sgid
    });

    return result;
}

module.exports = servergroupdelclient;