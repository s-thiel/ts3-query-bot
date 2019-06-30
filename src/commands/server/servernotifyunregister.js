'use strict';

/**
 * servernotifyunregister
 * 
 * Unregisters all events previously registered with servernotifyregister so you will no longer receive notification messages.
 * 
 * @return {Promise}
 */
async function servernotifyunregister() {
    let result = await this.query.send('servernotifyunregister');
    return result;
}

module.exports = servernotifyunregister;