'use strict';

/**
 * servergrouplist
 * 
 * Displays a list of server groups available. Depending on your permissions, the output may also contain global
 * ServerQuery groups and template groups.
 * @return {Promise}
 */
async function servergrouplist() {
    let result = await this.query.send('servergrouplist');
    let servergroupList = [];
    let servergroupListById = {};
    let servergroupListByName = {};

    for (let i = 0; i < result.sgid.length; i++) {
        let servergroup = {};
        for (let param in result) {
            if (param != 'raw')
                servergroup[param] = result[param][i];
        }
        servergroupList.push(servergroup);
        servergroupListById[servergroup.sgid] = servergroup;
        servergroupListByName[servergroup.name] = servergroup;
    }

    return {
        default: servergroupList,
        byId : servergroupListById,
        byName : servergroupListByName
    };
}

module.exports = servergrouplist;