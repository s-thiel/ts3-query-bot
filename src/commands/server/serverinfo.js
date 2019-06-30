'use strict';

/**
 * serverInfo
 * 
 * Displays detailed configuration information about the selected virtual server including unique ID, number of
 * clients online, configuration, etc.
 * 
 * @return {Promise}
 */
async function serverinfo() {
    let result = await this.query.send('serverinfo');
    return result;
}

module.exports = serverinfo;