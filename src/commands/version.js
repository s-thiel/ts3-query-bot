'use strict';

/**
 * version
 * 
 * Displays the servers version information including platform and build number.
 * 
 * @return {Promise}
 */
async function version() {
    let result = await this.query.send('version');
    return result;
}

module.exports = version;