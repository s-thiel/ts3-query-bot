'use strict';

/**
 * clientList
 * 
 * Displays a list of clients online on a virtual server including their ID, nickname, status flags, etc. 
 * The output can be modified using several command options. 
 * Please note that the output will only contain clients which are currently in channels you're able to subscribe to.
 * 
 * @return {Promise}
 */
async function clientlist() {
    let result = await this.query.send('clientlist -uid -away -voice -country -info -groups');
    let clientList = [];
    let clientListById = {};
    let clientListByName = {};

    for (let i = 0; i < result.clid.length; i++) {
        let client = {};
        for (let param in result) {
            if (param != 'raw')
                client[param] = result[param][i];
        }
        clientList.push(client);
        clientListById[client.clid] = client;
        clientListByName[client.client_nickname] = client;
    }
    
    return {
        default: clientList,
        byId : clientListById,
        byName : clientListByName,
    };
}

module.exports = clientlist;