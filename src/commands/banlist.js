'use strict';

/**
 * banList
 * 
 * Displays a list of active bans on the selected virtual server.
 * 
 * @return {Promise}
 */
async function banList() {
    let result = await this.query.send('banlist');
    let banList = [];
    let banListById = {};

    for (let i = 0; i < result.banid.length; i++) {
        let ban = {};

        for (let param in result) {
            if (param != 'raw')
                ban[param] = result[param][i];
        }

        banList.push(ban);
        banListById[ban.banid] = ban;
    }

    return {
        default: banList,
        byId: banListById,
    };
}

module.exports = banList;