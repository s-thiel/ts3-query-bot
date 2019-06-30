'use strict';

/**
 * serverProcessStop
 * 
 * Stops the entire TeamSpeak 3 Server instance by shutting down the process.
 * 
 * @return {Promise}
 */
async function serverprocessstop() {
    let result = await this.query.send('serverprocessstop');
    return result;
}

module.exports = serverprocessstop;