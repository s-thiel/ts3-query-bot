'use strict';

const util = require('./../util');

class dynamicChannels {
    /**
     * constructor
     * 
     * @param {Object} query 
     */
    constructor(query) {
        this._query = query;
        this._interval;
        this._timeout;
        this._channels = {};
    }

    /**
     * start
     * 
     * @param {Number} interval 
     */
    async start(interval = 10000) {
        this._interval = interval;
        this._check();
    }

    /**
     * stop
     */
    stop() {
        clearTimeout(this._interval);
        this._interval;
        this._timeout;
    }

    /**
     * _check
     */
    async _check() {
        if(Object.keys(this._channels).length) {
            try {
                let channels = await this._query.channellist();
                let parentChannels = Object.keys(this._channels);

                for(let pid of parentChannels) {
                    let subChannels = [];
                    let subChannelsName = [];
                    let emptySubChannels = [];
                    let { list, perms } = this._channels[pid];
                    let max = list.length;
    
                    for(let channel of channels.default) {
                        if(pid == channel.pid) {
                            subChannels.push(channel);
                            subChannelsName.push(channel.channel_name);
                            let { total_clients } = channel;
                            if(parseInt(total_clients, 10) == 0 ) {
                                emptySubChannels.push(channel);
                            }
                        }
                    }
    
                    let empty = emptySubChannels.length;
                    let amount = subChannels.length;
    
                    if(!empty && amount < max) {
                        let freeNames = util.arrayDifference(list, subChannelsName);
                        await this._query.channelcreate({ channel_name : freeNames[0], cpid : pid, channel_flag_permanent : 1 }, perms);
                    } else if(empty > 1) {
                        let removeNum = empty - 1;
                        for(let i = 0; i < removeNum; i++) {
                            let channel = emptySubChannels.pop();
                            await this._query.channeldelete(channel.cid);
                        }
                    }
                }
            } catch (error) {
                this._query._log(error);       
            }
        }

        this._timeout = setTimeout(async () => {
            this._check();
        }, this._interval);
    }

    /**
     * addChannel
     * 
     * @param {Number} pid 
     * @param {Object} config 
     */
    async addChannel(pid, config) {
        try {
            await this._query.channelinfo(pid);
        } catch(error) {
            throw new Error('Error: invalid channelID');
        }

        let channels = [];

        if(config.type == 'pattern') {
            for(let i = 0; i < config.max; i++) {
                channels.push(config.pattern.replace('%s', i + 1));
            }
        } else if(config.type == 'list') {
            channels = config.list;
        } else {
            throw new Error('');
        }

        this._channels[pid] = { list : channels, perms : config.perms };
    }

    /**
     * removeChannel
     * 
     * @param {Number} pid 
     */
    removeChannel(pid) {
        delete this._channels[pid];
    }
}

module.exports = dynamicChannels;