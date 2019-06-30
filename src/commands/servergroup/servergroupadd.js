'use strict';

/**
 * servergroupAdd
 * 
 * Creates a new server group using the name specified with name and displays its ID.
 * 
 * @param {String} name
 * @return {Promise}
 */
async function servergroupAdd(name) {
    if (!name)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('servergroupadd', {
        name: name
    });

    return result;
}

module.exports = servergroupAdd;