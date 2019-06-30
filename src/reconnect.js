'use strict';

let _checkConnectionTimeout, _ms, _conn;

/**
 * init
 * 
 * @param {Object} conn 
 * @param {Number} ms 
 */
function init(conn, ms = 5000) {
    _ms = ms;
    _conn = conn;
    _checkConnectionTimeout = setTimeout(() => {
        _checkConnection();
    }, _ms);
}

/**
 * clear
 */
function clear() {
    clearTimeout(_checkConnectionTimeout);
}

/**
 * _checkConnection
 * 
 * @return {Promise}
 */
async function _checkConnection() {
    try {
        await _conn.version();
    } catch(error) {
        await _conn.disconnect();
        await _conn.connect();
    }

    setTimeout(() => {
        _checkConnection(_ms);
    }, _ms);
}

module.exports = { init, clear };