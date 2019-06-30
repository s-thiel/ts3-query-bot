'use strict';

/**
 * quit
 * 
 * Closes the ServerQuery connection to the TeamSpeak 3 Server instance
 *  
 * @return {Promise}
 */
async function quit() {
    let result = await this.query.send('quit');
    return result;
}

module.exports = quit;