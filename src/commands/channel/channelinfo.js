'use strict';

/**
 * channelinfo
 * 
 * Displays detailed configuration information about a channel including ID, topic, description, etc.
 * 
 * @param {Number} cid
 * @return {Promise} 
 */
async function channelinfo(cid) {
    if (!cid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = this.query.send('channelinfo', {
        cid: cid
    });
    return result;
}

module.exports = channelinfo;