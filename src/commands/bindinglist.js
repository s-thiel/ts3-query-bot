'use strict';

/**
 * bindinglist
 * 
 * Displays a list of IP addresses used by the server 
 * instance on multi-homed machines.
 * 
 * @return {Promise}
 */
async function bindinglist() {
    let result = await this.query.send('bindinglist');
    return result;
}

module.exports = bindinglist;