'use strict';

/**
 * hostinfo
 * 
 * Displays detailed connection information 
 * about the server instance including uptime, number of virtual
 * servers online, traffic information, etc.
 * 
 * @return {Promise}
 */
async function hostinfo() {
    let result = await this.query.send('hostinfo');
    return result;
}

module.exports = hostinfo;