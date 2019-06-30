'use strict';

/**
 * servergroupRename
 * 
 * Changes the name of the server group specified with sgid.
 * 
 * @param {Number} sgid 
 * @param {String} name 
 * @return {Promise}
 */
async function servergroupRename(sgid, name) {

    if (!sgid || !name) {
        throw new Error('ERROR_MISSING_PARAM');
    }

    let result = await this.query.send('servergrouprename', {
        sgid: sgid,
        name: name
    });

    return result;
}

module.exports = servergroupRename;