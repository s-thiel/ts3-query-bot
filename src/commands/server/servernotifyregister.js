'use strict';

/**
 * servernotifyregister
 * 
 * Registers for a specified category of events on a virtual server to receive notification messages. 
 * Depending on the notifications you've registered for, the server will send you a message on every event in the view of your 
 * ServerQuery client (e.g. clients joining your channel, incoming text messages, server configuration changes, etc). 
 * The event source is declared by the event parameter while id can be used to limit the notifications to a specific channel.
 *  
 * @param {String} event
 * @param {Number} channelID
 * @return {Promise}
 */
async function servernotifyregister(event, channelID) {
    let props = {};

    if (!event)
        throw new Error('ERROR_MISSING_PARAM');

    props.event = event;

    if (channelID)
        props.id = channelID

    let result = await this.query.send('servernotifyregister', props);
    return result;
}

module.exports = servernotifyregister;