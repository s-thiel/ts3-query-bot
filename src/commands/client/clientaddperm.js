'use strict';

/**
 * clientaddperm
 * 
 * Adds a set of specified permissions to a client. 
 * Multiple permissions can be added by providing the three parameters of each permission.
 * 
 * @param {Number} cldbid
 * @param {Object} perms 
 * @return {Promise}
 */
async function clientaddperm(cldbid, perms) {
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

    let result = await this.query.send('clientaddperm', {
        cldbid: cldbid
    }, permArr.join('|'));
    return result;
}

module.exports = clientaddperm;