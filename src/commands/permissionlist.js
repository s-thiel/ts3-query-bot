'use strict';

/**
 * permissionlist
 * 
 * Displays a list of permissions available on the server instance including ID, name and description.
 * 
 * @return {Promise}
 */
async function permissionlist() {
    let result = await this.query.send('permissionlist');
    let permissionList = [];
    let permissionListById = {};
    let permissionListByName = {};

    for (let i = 0; i < result.permid.length; i++) {
        let perm = {
            permid: result.permid[i],
            permname: result.permname[i],
            permdesc: result.permdesc[i],
        };
        permissionList.push(perm);
        permissionListById[perm.permid];
        permissionListByName[perm.permname];
    }

    return {
        default: permissionList,
        byId: permissionListById,
        byName: permissionListByName
    };
}

module.exports = permissionlist;