'use strict';

/**
 * clientupdate
 * 
 * Change your ServerQuery clients settings using given properties.
 * @param {Object} props 
 * @return {Promise}
 */
async function clientupdate(props) {
    let result = await this.query.send('clientupdate', props);
    return result;
}

module.exports = clientupdate;