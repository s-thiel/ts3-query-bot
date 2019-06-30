'use strict';

/**
 * channellist
 * 
 * Displays a list of channels created on a virtual server including their ID, order, name, etc. 
 * The output can be modified using several command options.
 * 
 * @return {Promise}
 */
async function channellist() {
    let result = await this.query.send('channellist -topic -flags -voice -limits');
    let channelList = [];
    let channelListById = {};
    let channelListByName = {};
    let channelListByPid = {};

    for (let i = 0; i < result.cid.length; i++) {
        let channel = {};
        for (let param in result) {
            if (param != 'raw')
                channel[param] = result[param][i];
        }

        if(!channelListByPid[channel.pid])
            channelListByPid[channel.pid] = [];
        channelListByPid[channel.pid].push(channel);
        channelList.push(channel);
        channelListById[channel.cid] = channel;
        channelListByName[channel.channel_name] = channel;
    }

    return {
        default: channelList,
        byId: channelListById,
        byName: channelListByName,
        byPid: channelListByPid
    };
}

module.exports = channellist;