'use strict';

/**
 * servergroupAddClient
 * 
 * Adds a client to the server group specified with sgid. 
 * Please note that a client cannot be added to default groups or template groups.
 * 
 * @param {Number} cluid 
 * @param {Number} sgid 
 * @return {Promise}
 */
async function servergroupAddClient(cluid, sgid) {
    if (!cluid || !sgid)
        throw new Error('ERROR_MISSING_PARAM');

    let client = await this.query.send('clientgetdbidfromuid', {
        cluid: cluid
    });

    if (!client.cldbid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('servergroupaddclient', {
        cldbid: client.cldbid,
        sgid: sgid
    });

    return result;
}

module.exports = servergroupAddClient;