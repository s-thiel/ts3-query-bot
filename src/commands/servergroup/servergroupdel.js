'use strict';

/**
 * servergroupDel
 * 
 * Deletes the server group specified with sgid. If force is set to 1, the server group will be deleted even if there
 * are clients within.
 * 
 * @param {Number} sgid
 * @param {Number} force
 * @return {Promise}
 */
async function servergroupdel(sgid, force = 0) {
    if (!sgid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('servergroupdel', {
        sgid: sgid,
        force: force
    });

    return result;
}

module.exports = servergroupdel;