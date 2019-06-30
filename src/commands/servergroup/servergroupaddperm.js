'use strict';

/**
 * servergroupAddPerm
 * 
 * Adds a set of specified permissions to the server group specified with sgid. Multiple permissions can be added 
 * by providing the four parameters of each permission.
 * 
 * @param {Number} sgid
 * @param {Object} perms 
 * @return {Promise}
 */
async function servergroupAddPerm(sgid, perms) {
    if (!perms)
        throw new Error('ERROR_MISSING_PARAM');

    let permArr = [];
    for (let i = 0; i < perms.length; i++) {
        let perm = perms[i];

        if (!perm.id || !perm.value)
            continue;

        if (!perm.negated)
            perm.negated = 0;

        if (!perm.skip)
            perm.skip = 0;

        permArr.push('permid=' + perm.id + ' permvalue=' + perm.value + ' permnegated=' + perm.negated + ' permskip=' + perm.skip);
    }

    let result = await this.query.send('servergroupaddperm', {
        sgid: sgid
    }, permArr.join('|'));
    return result;
}

module.exports = servergroupAddPerm;