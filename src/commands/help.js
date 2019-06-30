'use strict';

/**
 * help
 * 
 * Provides information about ServerQuery commands. 
 * Used without parameters, help lists and briefly describes every command.
 *  
 * @param {String} cmd
 * @return {Promise}
 */
async function help(cmd) {
    if(!cmd)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('help', cmd);
    return result;
}

module.exports = help;