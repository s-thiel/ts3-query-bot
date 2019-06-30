'use strict';

/**
 * servergrouppermlist
 * 
 * Displays a list of permissions assigned to the server group specified with sgid.
 * 
 * @param {Number} sgid 
 * @return {Promise}
 */
async function servergrouppermlist(sgid) {
    if (!sgid)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('servergrouppermlist', {
        sgid: sgid
    });

    let servergroupPermlist = [];
    let servergroupPermlistById = {};

    for (let i = 0; i < result.permid.length; i++) {
        let perm = {};

        for (let param in result) {
            if (param != 'raw')
            perm[param] = result[param][i];
        }

        servergroupPermlist.push(perm);
        servergroupPermlistById[perm.permid] = perm;
    }

    return {
        default: servergroupPermlist,
        byId: servergroupPermlistById,
    };
}

module.exports = servergrouppermlist;