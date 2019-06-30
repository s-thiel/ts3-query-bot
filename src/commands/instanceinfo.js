'use strict';

/**
 * instanceinfo
 * 
 * Displays detailed connection information 
 * about the server instance including uptime, number of virtual
 * servers online, traffic information, etc.
 * 
 * @return {Promise}
 */
async function instanceinfo() {
    let result = await this.query.send('instanceinfo');
    return result;
}

module.exports = instanceinfo;