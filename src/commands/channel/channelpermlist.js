'use strict';

/**
 * channelPermList
 * 
 * Displays a list of permissions defined for a channel.
 * 
 * @param {Number} channelId
 * @return {Promise} 
 */
async function channelpermlist(channelId) {
    if (!channelId)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('channelpermlist', {
        cid: channelId
    });
    let permissionList = [];
    let permissionListById = {};

    for (let i = 0; i < result.permid.length; i++) {
        let perm = {};
        for (let param in result) {
            if (param != 'raw' && param != 'cid')
                perm[param] = result[param][i];
        }
        permissionList.push(perm);
        permissionListById[perm.permid] = perm;
    }

    return {
        default: permissionList,
        byId: permissionListById
    };
}

module.exports = channelpermlist;