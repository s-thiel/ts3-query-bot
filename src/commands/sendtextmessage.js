'use strict';

/**
 * sendtextmessage
 * 
 * Sends a text message a specified target. The type of the target is determined by targetmode while target
 * specifies the ID of the recipient, whether it be a virtual server, a channel or a client.
 * 
 * @param {Number} targetmode 
 * @param {Number} target 
 * @param {String} msg 
 */
async function sendtextmessage(targetmode, target, msg) {
    if (!msg || !targetmode || !target)
        throw new Error('ERROR_MISSING_PARAM');

    let result = await this.query.send('sendtextmessage', {
        targetmode: targetmode,
        target: target,
        msg: msg
    });
    return result;
}

module.exports = sendtextmessage;