'use strict';

/**
 * serverlist
 * 
 * Displays a list of virtual servers including their ID, status, number of clients online, etc. 
 * If you're using the -all option, the server will list all virtual servers stored in the database. 
 * This can be useful when multiple server instances with different machine IDs are using the same database.
 * The machine ID is used to identify the server instance a virtual server is associated with. #
 * The status of a virtual server can be either online, none and virtual. 
 * While online and none are selfexplanatory, virtual is a bit more complicated. 
 * Whenever you select a virtual server which is currently stopped, it will be started in virtual mode 
 * which means you are able to change its configuration, create channels or change permissions, but no regular TeamSpeak 3 Client can connect. 
 * As soon as the last ServerQuery client deselects the virtual server, its status will be changed back to none.
 * 
 * @return {Promise}
 */
async function serverlist() {
    let result = await this.query.send('serverlist -uid -all');
    return result;
}

module.exports = serverlist;