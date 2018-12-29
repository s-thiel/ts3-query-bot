'use strict';

const TeamspeakQuery = require('teamspeak-query');
const EventEmitter = require('events');

class ts3QueryClient extends EventEmitter {

    /**
     * constructor
     * 
     * @param {Object} config 
     */
    constructor(config = {}) {
        super();

        this.config = Object.assign({
            type : 'ssh',
            ip : '127.0.0.1',
            port : 10022,
            serverID : 1,
            nickname : 'TS3 ServerQuery',
        }, config);

        this.connected = false;
        this.clients = {};
        this.clientEnterViewBlocked = {};
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

        if(args.length > 1)
            this.emit('log',  args.join(', '));
        else
            this.emit('log',  args[0]);
    }

    /**
     * start
     * 
     * @return {Promise}
     */
    async start() {    
        try {
            await this.servernotifyregister('server');
            await this.servernotifyregister('textprivate');
            await this.servernotifyregister('textserver');
            await this.servernotifyregister('textchannel');

            this.query.on('cliententerview', (data) => {
                if(this.clientEnterViewBlocked[data.client_unique_identifier])
                    return;

                this.clientEnterViewBlocked[data.client_unique_identifier] = true;
                
                this.clientJoined(data);

                setTimeout(() => {
                    delete this.clientEnterViewBlocked[data.client_unique_identifier];
                }, 1000);
            });

            this.query.on('clientleftview', (data) => {
                this.clientLeft(data);
            });

            this.query.on('textmessage', (data) => {
                if(data.invokername == this.config.nickname)
                    return;

                this.emit('textmessage', data);
            });

            this.query.on('serveredited', (data) => {
                this.emit('serveredited', data);
            });

            this.query.on('channeledited', (data) => {
                this.emit('channeledited', data);
            });

            this.query.on('channeldescriptionchanged', (data) => {
                this.emit('channeldescriptionchanged', data);
            })

            if(this.config.disableKeepalive)
                this.query.keepalive.enable(false);

            this.emit('bot-rdy');
        } catch(error) {
            this.connected = false;
            this._log(error);
        } 
    }

    /**
     * stop
     */
    async stop() {
        try {
            this._log('Stop TS3Bot');
            await this.query.disconnect();    
            this.connected = false;
        } catch(error) {
            this._log(error);
        }
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
        let client = Object.assign({
            start : new Date(),
            end : null,
        }, data);

        this.clients[data.clid] = client;
        this.emit('cliententerview', data);
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
        this.emit('clientleftview', data);
        this.clientSave(client);
    }

    /**
     * clientSave
     * 
     * @param {Object} data 
     */
    clientSave(data) {
        this.emit('clientConnectionEnd', data);
    }

    /**
     * SERVER FUNCTIONS ---------------------------------------------------------------------------------
     */

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
    async servernotifyregister(event, channelID) {
        return new Promise((resolve, reject) => {

            let props = {};

            if(!event)
                reject('ERROR_MISSING_PARAM');

            props.event = event;

            if(channelID)
                props.id = channelID

            this.query.send('servernotifyregister', props)
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * servernotifyunregister
     * 
     * Unregisters all events previously registered with servernotifyregister so you will no longer receive notification messages.
     * 
     * @return {Promise}
     */
    async servernotifyunregister() {
        return new Promise((resolve, reject) => {
            this.query.send('servernotifyunregister')
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * help
     * 
     * Provides information about ServerQuery commands. 
     * Used without parameters, help lists and briefly describes every command.
     *  
     * @param {String} cmd
     * @return {Promise}
     */
    async help(cmd) {
        return new Promise((resolve, reject) => {
            this.query.send('help', cmd)
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * quit
     * 
     * Closes the ServerQuery connection to the TeamSpeak 3 Server instance
     *  
     * @return {Promise}
     */
    async quit() {
        return new Promise((resolve, reject) => {
            this.query.send('quit')
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * login
     * 
     * Authenticates with the TeamSpeak 3 Server instance using given ServerQuery login credentials.
     *  
     * @param {String} username
     * @param {String} password
     * @return {Promise}
     */
    async login(username, password) {
        return new Promise((resolve, reject) => {

            if(!username || !password)
                reject('ERROR_MISSING_PARAM');

            this.query.send('login', {
                client_login_name : username,
                client_login_password : password
            })
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * logout
     * 
     * Deselects the active virtual server and logs out from the server instance.
     *  
     * @return {Promise}
     */
    async logout() {
        return new Promise((resolve, reject) => {
            this.query.send('logout')
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * version
     * 
     * Displays the servers version information including platform and build number.
     * 
     * @return {Promise}
     */
    async version() {
        return new Promise((resolve, reject) => {
            this.query.send('version')
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * hostinfo
     * 
     * Displays detailed connection information 
     * about the server instance including uptime, number of virtual
     * servers online, traffic information, etc.
     * 
     * @return {Promise}
     */
    async hostinfo() {
        return new Promise((resolve, reject) => {
            this.query.send('hostinfo')
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * instanceinfo
     * 
     * Displays detailed connection information 
     * about the server instance including uptime, number of virtual
     * servers online, traffic information, etc.
     * 
     * @return {Promise}
     */
    async instanceinfo() {
        return new Promise((resolve, reject) => {
            this.query.send('instanceinfo')
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * instanceedit
     * 
     * Changes the server instance configuration using given properties.
     * 
     * @param {Object} props
     * @return {Promise}
     */
    async instanceedit(props) {
        return new Promise((resolve, reject) => {
            this.query.send('instanceedit', props)
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * bindinglist
     * 
     * Displays a list of IP addresses used by the server 
     * instance on multi-homed machines.
     * 
     * @return {Promise}
     */
    async bindinglist() {
        return new Promise((resolve, reject) => {
            this.query.send('bindinglist')
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

    /**
     * use
     * 
     * Displays a list of IP addresses used by the server 
     * instance on multi-homed machines.
     * 
     * @param {Number} sid
     * @param {Number} port
     * @return {Promise}
     */
    async use(sid, port) {
        return new Promise((resolve, reject) => {

            let props = {};

            if(!sid)
                reject('ERROR_MISSING_PARAM');

            props.sid = sid;

            if(port)
                props.port = port;

            this.query.send('use', props)
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });  
    }

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
     * serverlist
     * 
     * Displays a list of virtual servers including their ID, status, number of clients online, etc. 
     * If you're using the -all option, the server will list all virtual servers stored in the database. 
     * This can be useful when multiple server instances with different machine IDs are using the same database.
     * The machine ID is used to identify the server instance a virtual server is associated with. #
     * The status of a virtual server can be either online, none and virtual. 
     * While online and none are selfexplanatory, virtual is a bit more complicated. 
     * Whenever you select a virtual server which is currently stopped, it will be started in virtual mode 
     * which means you are able to change its configuration, create channels or change permissions, but no regular TeamSpeak 3 Client can connect. 
     * As soon as the last ServerQuery client deselects the virtual server, its status will be changed back to none.
     * 
     * @return {Promise}
     */
    async serverlist() {
        return new Promise((resolve, reject) => {
            this.query.send('serverlist -uid -all')
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
                let servergroupList = [];
                for(let i = 0; i < res.sgid.length; i++) {
                    let servergroup = {};
                    for(let param in res) {
                        servergroup[param] = res[param][i];
                    }
                    servergroupList.push(servergroup);
                }
                resolve(servergroupList);
            }).catch((error) => {
                reject(error);
            });  
        });  
    }

    /**
     * CLIENT FUNCTIONS --------------------------------------------------------------------------------------
     */

    /**
     * clientupdate
     * 
     * Change your ServerQuery clients settings using given properties.
     * @param {Object} props 
     * @return {Promise}
     */
    async clientupdate(props) {
        return new Promise((resolve, reject) => {
            this.query.send('clientupdate', props)
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            }); 
        });
    }


    /**
     * clientList
     * 
     * Displays a list of clients online on a virtual server including their ID, nickname, status flags, etc. 
     * The output can be modified using several command options. 
     * Please note that the output will only contain clients which are currently in channels you're able to subscribe to.
     * 
     * @return {Promise}
     */
    async clientList() {
        return new Promise((resolve, reject) => {
            this.query.send('clientlist -uid -away -voice -country -info -groups')
            .then((res) => {
                let clientList = [];
                for(let i = 0; i < res.clid.length; i++) {
                    let client = {};

                    for(let param in res) {
                        client[param] = res[param][i];
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
     * servergroupAddClient
     * 
     * Adds a client to the server group specified with sgid. 
     * Please note that a client cannot be added to default groups or template groups.
     * 
     * @param {Number} cluid 
     * @param {Number} sgid 
     * @return {Promise}
     */
    async servergroupAddClient(cluid, sgid) {
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
     * servergroupDelClient
     * 
     * Removes a client from the server group specified with sgid.
     * 
     * @param {Number} cluid 
     * @param {Number} sgid 
     * @return {Promise}
     */
    async servergroupDelClient(cluid, sgid) {
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
     * Moves one or more clients specified with clid to the channel with ID cid.
     * If the target channel has a password, it needs to be specified with cpw. 
     * If the channel has no password, the parameter can be omitted.
     * 
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
     * clientKick
     * 
     * Kicks one client specified with clid from currently joined channel or from the server, 
     * depending on reasonid. The reasonmsg parameter specifies a text message sent to the kicked clients. 
     * This parameter is optional and may only have a maximum of 40 characters.
     * 
     * @param {Number} clid 
     * @param {String} msg 
     * @param {Number} reasonid 
     * @return {Promise}
     */
    async clientKick(clid, msg, reasonid = 4) {
        return new Promise((resolve, reject) => {

            if(!clid || !msg) {
                reject('ERROR_MISSING_PARAM');
            }

            if(msg.length > 40 || reasonid < 4 || reasonid > 5) {
                reject('ERROR_WRONG_PARAM');
            }

            this.query.send('clientkick', {clid : clid, reasonid : reasonid, reasonmsg : msg})
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

    /**
     * BAN FUNCTIONS -------------------------------------------------------------------------------------
     */
    
    /**
     * banClient
     * 
     * Bans the client specified with ID clid from the server. 
     * Please note that this will create two separate ban rules for 
     * the targeted clients IP address and his unique identifier.
     * 
     * @param {Number} clid
     * @param {Number} time
     * @param {String} msg
     * @return {Promise}
     */
    async banClient(clid, time, msg) {
        return new Promise((resolve, reject) => {

            if(!clid) {
                reject('ERROR_MISSING_PARAM');
            }

            let props = {
                clid : clid,
            };

            if(time)
                props.time = time;

            if(msg)
                props.msg = msg;

            this.query.send('banclient', props)
            .then((res) => {
                resolve(res);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * banList
     * 
     * Displays a list of active bans on the selected virtual server.
     * 
     * @return {Promise}
     */
    async banList() {
        return new Promise((resolve, reject) => {
            this.query.send('banlist')
            .then((res) => {
                resolve(res);             
            }).catch((error) => {
                reject(error);
            }); 
        });
    }

}

module.exports = ts3QueryClient