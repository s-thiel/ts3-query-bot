'use strict';

/**
 * channelAddPerm
 * 
 * Adds a set of specified permissions to a channel.
 * Multiple permissions can be added by providing the two parameters of each permission.
 * 
 * @param {Number} cid 
 * @param {Object} perms
 * @return {Promise} 
 */
async function channeladdperm(cid, perms) {
    if (!cid || !perms)
        throw new Error('ERROR_MISSING_PARAM');

    let permArr = [];
    for (let perm in perms) {
        let value = perms[perm];
        permArr.push('permid=' + perm + ' permvalue=' + value);
    }
    let result = await this.query.send('channeladdperm', {
        cid: cid
    }, permArr.join('|'));
    return result;
}

module.exports = channeladdperm;