'use strict';

/** 
 * channelFind
 * 
 * Displays a list of channels matching a given name pattern.
 * 
 * @param {String} name
 * @return {Promise}
 */
async function channelfind(name) {
    if (!name)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('channelfind', {
        pattern: name
    });

    return result;
}

module.exports = channelfind;