'use strict';

/**
 * logout
 * 
 * Deselects the active virtual server and logs out from the server instance.
 *  
 * @return {Promise}
 */
async function logout() {
    let result = await this.query.send('logout');
    return result;
}

module.exports = logout;