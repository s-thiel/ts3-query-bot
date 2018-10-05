const TeamspeakQuery = require('teamspeak-query').Raw;
var events = require('events');
var EventEmitter = new events.EventEmitter();

exports.ts3client = class ts3client {

    constructor(config) {

        this.config = config;
        this.EventEmitter = EventEmitter;
        this.connected = false;

        this.clients = {};

        this.query = null;
        this.start();
    }

    log() {
        console.log(arguments);
    }

    start() {    

        this.log('Starting TS3 Bot');

        if(this.connected) {
            this.log('Bot is already connected');
            return;
        }

        this.log('Starting TS3 ServerQuery Connection');
        this.log('Connect to ' + this.config.ip + ':' + this.config.port);
        this.log('ServerID: ' + this.config.serverID);
        
        this.query = new TeamspeakQuery({host : this.config.ip, port : this.config.port});

        this.query.send('login', this.config.user, this.config.password)
        .then(() => this.query.send('use', this.config.serverID))
        .then(() => this.query.send('clientupdate', {'client_nickname' : this.config.nickname}))
        .then(() => this.query.send('servernotifyregister', { 'event': 'server' }))
        .then(() => this.query.send('servernotifyregister', { 'event': 'textprivate' }))    
        .then(() => {

            // disable default keepalive function
            if(this.config.no_keepalive)
                this.query.keepalive.enable(false);

            // disable throttle if own host
            if(this.config.no_throttle)
                this.query.throttle.set('enable', false);

            
            let sockEvents = ['error', 'drain', 'timeout', 'end', 'close'];
            for(let sockEvent in sockEvents) {
                this.query.sock.on(sockEvent, (e) => {
                    this.log(e);
                    this.EventEmitter.emit(sockEvent, e);
                });
            }

            this.query.on('cliententerview', data => {
                this.clientJoined(data);
                this.EventEmitter.emit('cliententerview', data);
            });

            this.query.on('clientleftview', data => {
                this.clientLeft(data);
                this.EventEmitter.emit('clientleftview', data);
            });

            this.query.on('textmessage', data => {
                this.EventEmitter.emit('textmessage', data);
            });

            this.connected = new Date().getTime();
        })
        .catch((error) => {
            this.log('An error occured:', JSON.stringify(error));
            if(this.connected)
                this.stop(true);
        });  

        this.checkInterval = setInterval(() => {
            this.checkConnection();
        }, 120000);    
    }

    stop(restart) {
        this.log('STOP TS3BOT');
        try {
            clearInterval(this.checkInterval);
            clearInterval(this.statsInterval);
            this.query.send('quit');
            this.query.sock.destroy();
            this.query = null;
            if(this.socket)
                this.socket.close();
            this.connected = 0;
            this.checkInterval;
            
            if(restart)
                process.exit(0);
        }
        catch (e) {
            this.log(e);
        }
    }

    ping() {
        this.query.send('version')
        .then(() => {
            this.connected = new Date().getTime();
        })
	    .catch((error) => {
            this.log('An error occured:', error)
        });
    }

    checkConnection() {
        if(this.connected < (new Date().getTime() - 180000)) { 
            this.stop(true);
        }
    }

    /**
     * CUSTOM CLIENT STATS FUNCTIONS -------------------------------------------------------------------------
     */

    clientJoined(data)  {
        let { clid, client_unique_identifier, client_country } = data;

        let client = {
            start : new Date(),
            end : null,
            country : client_country,
            cluid : client_unique_identifier
        };

        this.clients[clid] = client;
    }

    clientLeft(data) {
        let { clid } = data;
        let client = this.clients[clid];
        client.end = new Date();
        this.EventEmitter.emit('clientLeftViewCustom', client);
    }

    /**
     * SERVERGROUP FUNCTIONS ---------------------------------------------------------------------------------
     */

    /**
     * getServergroupList
     * 
     * get the full server group list
     * @return {Promise}
     */
    getServergroupList() {
        return new Promise((resolve, reject) => {
            this.query.send('servergrouplist')
            .then(res => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            });  
        });  
    }

    /**
     * CLIENT FUNCTIONS --------------------------------------------------------------------------------------
     */

    /**
     * getClientList
     * 
     * get full client list
     * @return {Promise}
     */
    getClientList() {
        return new Promise((resolve, reject) => {
            this.query.send('clientlist -uid -away -voice -country -info -groups', '')
            .then((res) => {
                let clientList = [];
                for(let i = 0; i < res.clid.length; i++) {
                    let client = {
                        clid : res.clid[i],
                        cid : res.cid[i],
                        clbid : res.client_database_id[i],
                        client_nickname : res.client_nickname[i],
                        client_database_id : res.client_database_id[i],
                        uid : res.client_unique_identifier[i],
                        client_type : res.client_type[i],
                        client_away : res.client_away[i],
                        client_servergroups : res.client_servergroups[i],
                        client_platform : res.client_platform[i],
                        client_is_recording : res.client_is_recording[i],
                        client_input_muted : res.client_input_muted[i],
                        client_output_muted : res.client_output_muted[i],
                        client_is_talker : res.client_is_talker[i],
                        client_flag_talking : res.client_flag_talking[i],
                        client_unique_identifier: res.client_unique_identifier[i],
                    }
                    clientList.push(client);
                }
                resolve(clientList);
            }).catch((error) => {
                reject(error);
            });  
        });  
    }

    /**
     * clientGrantServergroup
     * 
     * Grant client a server group
     * @param {Number} cluid 
     * @param {Number} sgid 
     * @return {Promise}
     */
    async clientGrantServergroup(cluid, sgid) {
        return new Promise((resolve, reject) => {

            if(!cluid || !sgid) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('clientgetdbidfromuid',  {cluid : cluid})
            .then((res) => {
                if(res.cldbid) {
                    this.query.send('servergroupaddclient',  {cldbid : res.cldbid, sgid : sgid})
                    .then((res) => {
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
                }
            })
            .catch((error) => {
                reject(error)
            });
        });
    }

    /**
     * clientRevokeServergroup
     * 
     * Remove servergroup from a client
     * @param {Number} cluid 
     * @param {Number} sgid 
     * @return {Promise}
     */
    async clientRevokeServergroup(cluid, sgid) {
        return new Promise((resolve, reject) => {

            if(!cluid || !sgid) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('clientgetdbidfromuid',  {cluid : cluid})
            .then((res) => {
                if(res.cldbid) {
                    this.query.send('servergroupdelclient',  {cldbid : res.cldbid, sgid : sgid})
                    .then((res) => {
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
                }
            })
            .catch((error) => {
                reject(error)
            }); 
        });
    }

    /**
     * clientInfo
     * 
     * returns client information
     * @param {Number} clid 
     * @return {Promise}
     */
    async clientInfo(clid) {
        return new Promise((resolve, reject) => {

            if(!clid) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send("clientinfo", {clid : clid})
            .then((res) => {
                resolve(res);
            }).catch((error) => {
                reject(error);
            });
        });    
    }

    /**
     * clientMove
     * 
     * Moves a client to a specific channel
     * @param {Number} clid 
     * @param {Number} cid 
     * @return {Promise}
     */
    async clientMove(clid, cid) {
        return new Promise((resolve, reject) => {

            if(!clid || !cid) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('clientmove', {clid : clid, cid : cid})
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * clientMessage
     * 
     * @param {Number} clid 
     * @param {String} msg 
     * @return {Promise}
     */
    async clientMessage(clid, msg) {
        return new Promise((resolve, reject) => {

            if(!clid || !msg) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send("sendtextmessage", {targetmode : 1, target : clid, msg : msg})
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        })         
    }

    /**
     * clientPoke
     * 
     * @param {Number} clid 
     * @param {String} msg 
     * @return {Promise}
     */
    async clientPoke(clid, msg) {
        return new Promise((resolve, reject) => {

            if(!clid || !msg) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send("clientpoke", {clid : clid, msg : msg})
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        })         
    }


    /**
     * CHANNEL FUNCTIONS -------------------------------------------------------------------------------------
     */

    /**
     * getChannelList
     * 
     * Get full channel list
     * @return {Promise}
     */
    async getChannelList() {
        return new Promise((resolve, reject) => {
            this.query.send('channellist')
            .then((res) => {
                let channelList = [];
                for(let i = 0; i < res.cid.length; i++) {
                    let channel = {
                        cid : res.cid[i],
                        pid : res.pid[i],
                        channel_order : res.channel_order[i],
                        channel_name : res.channel_name[i],
                        total_clients : res.total_clients[i],
                        channel_needed_subscribe_power : res.channel_needed_subscribe_power[i]
                    }    
                    channelList.push(channel);
                }
                resolve(channelList);
            }).catch((error) => {
                reject(error);
            });  
        });  
    }

    /**
     * Create a Channel with the given props and perms
     * @param {object} props 
     * @return {boolean}
     */
    async channelCreate(props, perms) {
        return new Promise((resolve, reject) => {

            if(!props) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('channelcreate', props)
            .then((res) => {
                let permArr = [];
                for (let perm in perms) {
                    let value = perms[perm];
                    permArr.push("permid=" + perm + " permvalue=" + value);
                }
                this.query.send('channeladdperm', { cid : res.cid }, permArr.join('|'))
                .then((res) => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * channelDelete
     * 
     * Delete channel with the given channel_id
     * 
     * @param {Number} cid 
     * @param {function} cb 
     * @return {Promise}
     */
    async channelDelete(cid, force = 0) {
        return new Promise((resolve, reject) => {

            if(!cid) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('channeldelete', {cid : cid, force : force})
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        });   
    }

    /**
     * channelEdit
     * 
     * Edit channel with the given props
     * @param {object} props 
     * @return {Promise}
     */
    async channelEdit(props) {
        return new Promise((resolve, reject) => {

            if(!props.cid) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('channeledit', props)
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /** 
     * channelFindByName
     * 
     * find channel with certain pattern in name
     * 
     * @param {string} name
     * @return {Promise}
     */
    async channelFindByName(name) {
        return new Promise((resolve, reject) => {

            if(!name) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('channelfind', {pattern : name})
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        })   
    }

    /** 
     * channelFindById
     * 
     * @param {Number} cid
     * @return {Promise}
     */
    async channelFindById(cid) {
        return new Promise((resolve, reject) => {
            
            if(!cid) {
                reject("ERROR_MISSING_PARAM");
            }

            this.query.send('channelinfo', { cid : cid })
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }
}
