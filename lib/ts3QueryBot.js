'use strict';

const TeamspeakQuery = require('teamspeak-query');
const EventEmitter = require('events');

class ts3QueryBot extends EventEmitter {

    /**
     * constructor
     * 
     * @param {Object} config 
     */
    constructor(config = {}) {
        super();

        this.config = config;
        this.connected = false;

        this.clients = {};

        this.query = null;
    }

    /**
     * _log
     * 
     * emit arguments to log event
     */
    _log() {
        let args = Array.prototype.slice.call(arguments, 0);
       
        if(!args.length) {
            return;
        }
       
        this.emit('bot-log',  args.join(', '));
    }

    /**
     * start
     * 
     * @return {Promise}
     */
    async start() {    
        try {
            this._log('Starting TS3Bot');

            if(this.connected) {
                throw new Error('TS3Bot is already connected');
            }

            if(!this.config.port)
                this.config.port = 10011;

            if(!this.config.ip || !this.config.serverID || !this.config.user || !this.config.password ) {
                throw new Error('Missing config parameter');
            }

            this._log('Starting TS3 ServerQuery Connection');
            this._log('Connect to', this.config.ip, this.config.port);
            this._log('ServerID', this.config.serverID);
                
            this.query = new TeamspeakQuery.Raw({host : this.config.ip, port : this.config.port});

            await this.query.send('login', this.config.user, this.config.password);
            await this.query.send('use', this.config.serverID);
            await this.query.send('clientupdate', {'client_nickname' : this.config.nickname});
            await this.query.send('servernotifyregister', { 'event': 'server' });
            await this.query.send('servernotifyregister', { 'event': 'textprivate' });
            await this.query.send('servernotifyregister', { 'event': 'textserver' });
            await this.query.send('servernotifyregister', { 'event': 'textchannel' });
            await this.query.send('servernotifyregister', { 'event': 'channel', id : 0 });

            if(this.config.disableThrottle)
                this.query.throttle.set('enable', false);

            let sockEvents = ['error', 'drain', 'timeout', 'end', 'close'];
            for(let sockEvent in sockEvents) {
                this.query.sock.on(sockEvent, (error) => {
                    this.emit('socket-' + sockEvent, error);
                    if(this.config.forceRestartOnError) {
                        this.restart();
                    }
                });
            }

            this.query.on('cliententerview', (data) => {
                this.clientJoined(data);
                this.emit('cliententerview', data);
            });

            this.query.on('clientleftview', (data) => {
                this.clientLeft(data);
                this.emit('clientleftview', data);
            });

            this.query.on('textmessage', (data) => {

                if(data.invokername == this.config.nickname)
                    return;

                this.emit('textmessage', data);
            });

            this.query.on('serveredited', (data) => {
                this.emit('serveredited', data);
            });

            this.query.on('clientmoved', (data) => {
                this.emit('clientmoved', data);
            });

            this.query.on('channeledited', (data) => {
                this.emit('channeledited', data);
            });

            this.query.on('channeldescriptionchanged', (data) => {
                this.emit('channeldescriptionchanged', data);
            })

            if(this.config.disableKeepalive) {
                this.query.keepalive.enable(false);
            } else {
                this.checkInterval = setInterval(() => {
                    this._checkConnection();
                }, 1000 * 60);  
            }

            this.connected = true;
            this.emit('bot-rdy');
        } catch(error) {
            this.connected = false;
            this._log(error);
            this.emit('bot-error', 'Failed starting TS3Bot');
        } 
    }

    /**
     * stop
     */
    async stop() {
        try {
            this._log('Stop TS3Bot');
            await this.query.send('quit');    
            clearInterval(this.checkInterval);
            this.query.sock.destroy();
            this.query = null;

            if(this.socket)
                this.socket.close();

            this.connected = 0;
            this.checkInterval;
        } catch(error) {
            this._log(error);
            this.emit('bot-error', 'Failed stopping TS3Bot');
        }
    }

    /**
     * restart
     */
    async restart() {
        try {
            this._log('Restart TS3Bot')
            await this.stop();
            await this._wait(5000);
            await this.start();
        } catch (error) {
            this._log(error);
            this.emit('bot-error', 'Failed restarting TS3Bot');
        } 
    }

    /**
     * _ping
     */
    async _ping() {
        return new Promise((resolve, reject) => {
            this.query.send('version')
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * _checkConnection
     */
    async _checkConnection() {
        try {
            await this._ping();
        } catch (error) {
            this._log(error);
            this.restart();
        }
    }

    /**
     * _wait
     * 
     * @param {Number} timeout 
     */
    async _wait(timeout) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
      }

    /**
     * CUSTOM CLIENT STATS FUNCTIONS -------------------------------------------------------------------------
     */

    /**
     * clientJoined
     * 
     * @param {Object} data
     */
    clientJoined(data)  {
        let client = {
            start : new Date(),
            end : null,
        };

        for(let param in data) {
            client[param] = data[param];
        }

        this.clients[data.clid] = client;
        this.emit('bot-clientJoinedView', data);
    }

    /**
     * clientLeft
     * 
     * @param {Object} data 
     */
    clientLeft(data) {
        let { clid } = data;

        if(!this.clients[clid])
            return;

        let client = this.clients[clid];
        client.end = new Date();
        this.emit('bot-clientLeftView', data);
        this.clientSave(client);
    }

    /**
     * clientSave
     * 
     * @param {Object} data 
     */
    clientSave(data) {
        this.emit('bot-clientConnectionEnd', data);
    }

    /**
     * SERVER FUNCTIONS ---------------------------------------------------------------------------------
     */

    /**
     * serverInfo
     * 
     * Displays detailed configuration information about the selected virtual server including unique ID, number of
     * clients online, configuration, etc.
     * 
     * @return {Promise}
     */
    async serverInfo() {
        return new Promise((resolve, reject) => {
            this.query.send('serverinfo')
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            }); 
        });
    }

    /**
     * serverProcessStop
     * 
     * Stops the entire TeamSpeak 3 Server instance by shutting down the process.
     * 
     * @return {Promise}
     */
    async serverProcessStop() {
        return new Promise((resolve, reject) => {
            this.query.send('serverprocessstop')
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            }); 
        });
    }

    /**
     * serverRequestConnectionInfo
     * 
     * Displays detailed connection information about the selected virtual server including uptime, traffic
     * information, etc
     * @return {Promise}
     */
    async serverRequestConnectionInfo() {
        return new Promise((resolve, reject) => {
            this.query.send('serverrequestconnectioninfo')
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            }); 
        });
    }

    /**
     * gm
     * 
     * Sends a text message to all clients on all virtual servers in the TeamSpeak 3 Server instance.
     * @param {String} msg 
     * @return {Promise}
     */
    async gm(msg) {
        return new Promise((resolve, reject) => {

            if(!msg)
                reject('ERROR_MISSING_PARAM');

            this.query.send('gm', { msg : msg })
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            }); 
        });
    }

    /**
     * sendTextMessage
     * 
     * Sends a text message a specified target. The type of the target is determined by targetmode while target
     * specifies the ID of the recipient, whether it be a virtual server, a channel or a client.
     * 
     * @param {Number} targetmode 
     * @param {Number} target 
     * @param {String} msg 
     */
    async sendTextMessage(targetmode, target, msg) {
        return new Promise((resolve, reject) => {

            if(!msg || !targetmode || !target)
                reject('ERROR_MISSING_PARAM');

            this.query.send('sendtextmessage', { targetmode : targetmode, target : target, msg : msg })
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            }); 
        });
    }

    /**
     * SERVERGROUP FUNCTIONS ---------------------------------------------------------------------------------
     */

    /**
     * servergroupAdd
     * 
     * Creates a new server group using the name specified with name and displays its ID.
     * 
     * @param {String} name
     * @return {Promise}
     */
    async servergroupAdd(name) {
        return new Promise((resolve, reject) => {
            
            if(!name) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('servergroupadd', { name : name })
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            });  
        });  
    }

    /**
     * servergroupDel
     * 
     * Deletes the server group specified with sgid. If force is set to 1, the server group will be deleted even if there
     * are clients within.
     * 
     * @param {Number} sgid
     * @param {Number} force
     * @return {Promise}
     */
    async servergroupDel(sgid, force = 0) {
        return new Promise((resolve, reject) => {

            if(!sgid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('servergroupdel', { sgid : sgid, force : force })
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            });  
        }); 
    }

    /**
     * servergroupRename
     * 
     * Changes the name of the server group specified with sgid.
     * 
     * @param {Number} sgid 
     * @param {String} name 
     * @return {Promise}
     */
    async servergroupRename(sgid, name) {
        return new Promise((resolve, reject) => {

            if(!sgid || !name) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('servergrouprename', { sgid : sgid, name : name })
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            });  
        }); 
    }

    /**
     * servergroupPermlist
     * 
     * Displays a list of permissions assigned to the server group specified with sgid.
     * 
     * @param {Number} sgid 
     * @return {Promise}
     */
    async servergroupPermlist(sgid) {
        return new Promise((resolve, reject) => {

            if(!sgid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('servergrouppermlist', { sgid : sgid })
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            });  
        }); 
    }

    /**
     * servergroupAddPerm
     * 
     * Adds a set of specified permissions to the server group specified with sgid. Multiple permissions can be added 
     * by providing the four parameters of each permission.
     * 
     * @param {Object} perms 
     * @return {Promise}
     */
    async servergroupAddPerm(perms) {
        return new Promise((resolve, reject) => {

            if(!perms) {
                reject('ERROR_MISSING_PARAM');
            }

            let permArr = [];
            for (let i = 0; i < perms.length; i++) {
                let perm = perms[i];

                if(!perm.id ||!perm.value) {
                    continue;
                }

                if(!perm.negated)
                    perm.negated = 0;
                
                if(!perm.skip)
                    perm.skip = 0;
                
                permArr.push('permid=' + perm.id + ' permvalue=' + perm.value + ' permnegated=' + perm.negated + ' permskip=' + perm.skip);
            }

            this.query.send('servergroupaddperm', { sgid : sgid }, permArr.join('|'))
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            });  
        }); 
    }

    /**
     * servergroupDelPerm
     * 
     * Removes a set of specified permissions from the server group specified with sgid.
     * Multiple permissions can be removed at once.
     * 
     * @param {Number} sgid 
     * @param {Number} permid
     * @return {Promise} 
     */
    async servergroupDelPerm(sgid, permid) {
        return new Promise((resolve, reject) => {
            
            if(!sgid || !permid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('servergroupdelperm', { sgid : sgid, permid : permid })
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            });  
        });
    }

    /**
     * servergroupsByClientId
     * 
     * Displays all server groups the client specified with cldbid is currently residing in.
     * 
     * @param {Number} cluid
     * @return {Promise}
     */
    async servergroupsByClientId(cluid) {
        return new Promise((resolve, reject) => {
            
            if(!cluid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('clientgetdbidfromuid',  {cluid : cluid})
            .then((res) => {
                if(res.cldbid) {   
                    this.query.send('servergroupsbyclientid', { cldbid : res.cldbid })
                    .then((res) => {
                        resolve(res);             
                    })
                    .catch((error) => {
                        reject(error);
                    })
                } else {
                    reject();
                }
            })
            .catch((error) => {
                reject(error);
            });;  
        });
    }

    /**
     * servergroupList
     * 
     * Displays a list of server groups available. Depending on your permissions, the output may also contain global
     * ServerQuery groups and template groups.
     * @return {Promise}
     */
    async servergroupList() {
        return new Promise((resolve, reject) => {
            this.query.send('servergrouplist')
            .then((res) => {
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
    async getClientList() {
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
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('clientgetdbidfromuid',  {cluid : cluid})
            .then((res) => {
                if(res.cldbid) {
                    this.query.send('servergroupaddclient',  {cldbid : res.cldbid, sgid : sgid})
                    .then((res) => {
                        resolve(res);
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
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('clientgetdbidfromuid',  {cluid : cluid})
            .then((res) => {
                if(res.cldbid) {
                    this.query.send('servergroupdelclient',  {cldbid : res.cldbid, sgid : sgid})
                    .then((res) => {
                        resolve(res);
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
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('clientinfo', {clid : clid})
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
                reject('ERROR_MISSING_PARAM');
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
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('sendtextmessage', {targetmode : 1, target : clid, msg : msg})
            .then((res) => {
                resolve(res);
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
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('clientpoke', {clid : clid, msg : msg})
            .then((res) => {
                resolve(res);
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
     * channelList
     * 
     * Displays a list of channels created on a virtual server including their ID, order, name, etc. 
     * The output can be modified using several command options.
     * 
     * @return {Promise}
     */
    async channelList() {
        return new Promise((resolve, reject) => {
            this.query.send('channellist -topic -flags -voice -limits')
            .then((res) => {
                let channelList = [];
                for(let i = 0; i < res.cid.length; i++) {

                    let channel = {};
                    for(let param in res) {
                        channel[param] = res[param][i];
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
     * channelInfo
     * 
     * Displays detailed configuration information about a channel including ID, topic, description, etc.
     * 
     * @param {Number} cid
     * @return {Promise} 
     */
    async channelInfo(cid) {
        return new Promise((resolve, reject) => {

            if(!cid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('channelinfo', { cid : cid })
            .then((res) => {
                resolve(res);
            }).catch((error) => {
                reject(error);
            });  
        });  
    }

    
    /** 
     * channelFind
     * 
     * Displays a list of channels matching a given name pattern.
     * 
     * @param {string} name
     * @return {Promise}
     */
    async channelFind(name) {
        return new Promise((resolve, reject) => {

            if(!name) {
                reject('ERROR_MISSING_PARAM');
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
     * channelMove
     * 
     * Moves a channel to a new parent channel with the ID cpid. 
     * If order is specified, the channel will be sorted right
     * under the channel with the specified ID. 
     * If order is set to 0, the channel will be sorted right below the new parent.
     * 
     * @param {Number} cid 
     * @param {Number} cpid 
     * @param {Number} order 
     */
    async channelMove(cid, cpid, order = 0) {
        return new Promise((resolve, reject) => {

            if(!cid || !cpid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('channelmove', {cid : cid, cpid : cpid, order : order})
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * channelCreate
     * 
     * Creates a new channel using the given properties and displays its ID.
     * 
     * @param {Object} props 
     * @param {Object} Perms
     * @return {Promise}
     */
    async channelCreate(props, perms) {
        return new Promise((resolve, reject) => {

            if(!props) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('channelcreate', props)
            .then((res) => {
                let permArr = [];
                for (let perm in perms) {
                    let value = perms[perm];
                    permArr.push('permid=' + perm + ' permvalue=' + value);
                }
                this.query.send('channeladdperm', { cid : res.cid }, permArr.join('|'))
                .then((res) => {
                    resolve(res);
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
     * channelEdit
     * 
     * Changes a channels configuration using given properties. 
     * For detailed information, see Channel Properties in Documentation.
     * 
     * @param {object} props 
     * @return {Promise}
     */
    async channelEdit(props) {
        return new Promise((resolve, reject) => {

            if(!props.cid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('channeledit', props)
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * channelDelete
     * 
     * Deletes an existing channel by ID. If force is set to 1, 
     * the channel will be deleted even if there are clients within.
     * 
     * @param {Number} cid 
     * @param {Number} force 
     * @return {Promise}
     */
    async channelDelete(cid, force = 0) {
        return new Promise((resolve, reject) => {

            if(!cid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('channeldelete', { cid : cid, force : force })
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });   
    }

    /**
     * channelPermList
     * 
     * Displays a list of permissions defined for a channel.
     * 
     * @param {Number} cid
     * @return {Promise} 
     */
    async channelPermList(cid) {
        return new Promise((resolve, reject) => {

            if(!cid) {
                reject('ERROR_MISSING_PARAM');
            }

            this.query.send('channelpermlist', { cid : cid })
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * channelAddPerm
     * 
     * Adds a set of specified permissions to a channel.
     * Multiple permissions can be added by providing the twoparameters of each permission.
     * 
     * @param {Number} cid 
     * @param {Object} perms
     * @return {Promise} 
     */
    async channelAddPerm(cid, perms) {
        return new Promise((resolve, reject) => {

            if(!cid || !perms) {
                reject('ERROR_MISSING_PARAM');
            }

            let permArr = [];
            for (let perm in perms) {
                let value = perms[perm];
                permArr.push('permid=' + perm + ' permvalue=' + value);
            }
            this.query.send('channeladdperm', { cid : cid }, permArr.join('|'))
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * channelDelPerm
     * 
     * Removes a set of specified permissions from a channel. 
     * Multiple permissions can be removed at once.
     * 
     * @param {Number} cid 
     * @param {Object} perms
     * @return {Promise} 
     */
    async channelDelPerm(cid, perms) {
        return new Promise((resolve, reject) => {

            if(!cid) {
                reject("ERROR_MISSING_PARAM");
            }

            let props = {
                cid : cid
            };

            let permStr = '';
            let permArr = [];

            if(typeof perms == 'number') {
                props.permid = perms;
            } else if(typeof perms == 'object') {
                for(let i = 0; i < perms.length; i++)
                    permArr.push('permid=' + perms[i]);
                permStr = permArr.join('|'); 
            }

            this.query.send('channeldelperm', props, permStr)
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }
}

module.exports = {
    ts3QueryBot
};