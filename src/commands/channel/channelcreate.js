'use strict';

/**
 * channelCreate
 * 
 * Creates a new channel using the given properties and displays its ID.
 * 
 * @param {Object} props 
 * @param {Object} perms
 * @return {Promise}
 */
async function channelcreate(props, perms) {
    if (!props)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('channelcreate', props);
    if(perms)
        await this.channeladdperm(result.cid, perms);
    return result;
}

module.exports = channelcreate;