'use strict';

/**
 * serverrequestconnectioninfo
 * 
 * Displays detailed connection information about the selected virtual server including uptime, traffic
 * information, etc
 * @return {Promise}
 */
async function serverrequestconnectioninfo() {
    let result = await this.query.send('serverrequestconnectioninfo')
    return result;
}

module.exports = serverrequestconnectioninfo;