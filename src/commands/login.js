'use strict';

/**
 * login
 * 
 * Authenticates with the TeamSpeak 3 Server instance using given ServerQuery login credentials.
 *  
 * @param {String} username
 * @param {String} password
 * @return {Promise}
 */
async function login(username, password) {
    if (!username || !password)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('login', {
        client_login_name: username,
        client_login_password: password
    });
    return result;
}

module.exports = login;