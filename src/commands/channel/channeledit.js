'use strict';

/**
 * channelEdit
 * 
 * Changes a channels configuration using given properties. 
 * For detailed information, see Channel Properties in Documentation.
 * 
 * @param {object} props 
 * @return {Promise}
 */
async function channeledit(props) {
    if (!props.cid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('channeledit', props);
    return result;
}

module.exports = channeledit;