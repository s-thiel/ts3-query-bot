const ts3QueryClient = require('./base');
const TeamspeakQuery = require('teamspeak-query');

class sshTs3QueryClient extends ts3QueryClient {
    constructor(config = {}) {
        super();

        this.config = Object.assign({
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

    async connect() {
        try {
            this._log('Starting TS3Bot');

            if(this.connected)
                throw new Error('TS3Bot is already connected');

            if(!this.config.username || !this.config.password ) {
                throw new Error('Missing login credentials!');
            }
    
            this._log('Starting TS3 ServerQuery Connection');
            this._log('Connect to', this.config.ip, this.config.port);
            this._log('ServerID', this.config.serverID);

            this.query = new TeamspeakQuery.SSH({host : this.config.ip, port : this.config.port, username : this.config.username, password : this.config.password});
            await this.use(this.config.serverID);

            if(this.config.nickname.length)
                await this.clientupdate({'client_nickname' : this.config.nickname});

            if(this.config.disableThrottle)
                this.query.throttle.set('enable', false);

            this.connected = true;
            this.start();
        } catch(error) {
            this.connected = false;
            this._log(error);
        }
    }
}

module.exports = sshTs3QueryClient;