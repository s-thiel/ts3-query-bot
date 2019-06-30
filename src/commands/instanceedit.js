'use strict';

/**
 * instanceedit
 * 
 * Changes the server instance configuration using given properties.
 * 
 * @param {Object} props
 * @return {Promise}
 */
async function instanceedit(props) {
    let result = this.query.send('instanceedit', props);
    return result;
}

module.exports = instanceedit;