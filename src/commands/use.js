'use strict';

/**
 * use
 * 
 * Displays a list of IP addresses used by the server 
 * instance on multi-homed machines.
 * 
 * @param {Number} sid
 * @param {Number} port
 * @return {Promise}
 */
async function use(sid, port) {
    let props = {};

    if (!sid)
        throw new Error('ERROR_MISSING_PARAM');

    props.sid = sid;

    if (port)
        props.port = port;

    let result = await this.query.send('use', props);
    return result;
}

module.exports = use;