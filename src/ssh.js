const ts3QueryClient = require('./base');
const TeamspeakQuery = require('teamspeak-query');
const reconnect = require('./reconnect');

class sshTs3QueryClient extends ts3QueryClient {
    constructor(config) {
        super(config);
    }

    async connect() {
        try {  
            if(!this.configured) {
                this.once('configured', () => {
                    this.connect();
                });
                return;
            }

            if(this.connected)
                throw new Error(`TS3 ServerQuery is already connected`);

            if(!this.config.username || !this.config.password )
                throw new Error(`Missing login credentials!`);
    
            this._log(`Starting TS3 ServerQuery Connection`);
            this._log(`Connect to ${this.config.ip}:${this.config.port}`);
            this._log(`ServerID ${this.config.serverID}`);
            this.query = new TeamspeakQuery.SSH({host : this.config.ip, port : this.config.port, username : this.config.username, password : this.config.password});
            reconnect.init(this);
            await this._start();
        } catch(error) {
            this.connected = false;
            this._log(error);
        }
    }

    async disconnect() {
        reconnect.clear();
        await this._disconnect();
    }
}

module.exports = sshTs3QueryClient;