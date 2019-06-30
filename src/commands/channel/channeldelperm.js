'use strict';

/**
 * channelDelPerm
 * 
 * Removes a set of specified permissions from a channel. 
 * Multiple permissions can be removed at once.
 * 
 * @param {Number} cid 
 * @param {Object} perms
 * @return {Promise} 
 */
async function channeldelperm(cid, perms) {
    if (!cid)
        throw new Error("ERROR_MISSING_PARAM");

    let props = {
        cid: cid
    };

    let permStr = '';
    let permArr = [];

    if (typeof perms == 'number') {
        props.permid = perms;
    } else if (typeof perms == 'object') {
        for (let i = 0; i < perms.length; i++)
            permArr.push('permid=' + perms[i]);
        permStr = permArr.join('|');
    }

    let result = await this.query.send('channeldelperm', props, permStr);
    return result;
}

module.exports = channeldelperm;