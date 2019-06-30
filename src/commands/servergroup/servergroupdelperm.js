'use strict';

/**
 * servergroupDelPerm
 * 
 * Removes a set of specified permissions from the server group specified with sgid.
 * Multiple permissions can be removed at once.
 * 
 * @param {Number} sgid 
 * @param {Number} permid
 * @return {Promise} 
 */
async function servergroupDelPerm(sgid, permid) {
    if (!sgid || !permid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('servergroupdelperm', {
        sgid: sgid,
        permid: permid
    });

    return result;
}

module.exports = servergroupDelPerm;