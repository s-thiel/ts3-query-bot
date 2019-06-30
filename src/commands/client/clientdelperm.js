'use strict';

/**
 * clientdelperm
 * 
 * Removes a set of specified permissions from a client. Multiple permissions can be removed at once.
 * 
 * @param {Number} cldbid 
 * @param {Number} perms
 * @return {Promise} 
 */
async function clientdelperm(cldbid, perms) {
    if (!cldbid || !perms)
        throw new Error('ERROR_MISSING_PARAM');

    let props = {
        cldbid: cldbid
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

    let result = await this.query.send('clientdelperm', props, permStr);
    return result;
}

module.exports = clientdelperm;