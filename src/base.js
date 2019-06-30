'use strict';

const fs = require('fs').promises;
const path = require('path');
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
            ip: '127.0.0.1',
            port: 10022,
            serverID: 1,
            nickname: 'TS3 ServerQuery',
            events: {
                'server': true,
                'textprivate': true,
                'textserver': true,
                'textchannel': true
            },
        }, config);
        this.clientEnterViewBlocked = {};
        this.query = null;
        this.configured = false;
        this.connected = false;
        this.features = {};
        this._init();
    }

    /**
     * _log
     * 
     * emit arguments to log event
     */
    _log() {
        let args = Array.prototype.slice.call(arguments, 0);

        if (!args.length) {
            return;
        }

        if (args.length > 1)
            this.emit('log', args.join(', '));
        else
            this.emit('log', args[0]);
    }

    /**
     * _init
     */
    async _init() {
        let commandDir = path.join(__dirname, 'commands');
        await this._loadCommands(commandDir);
        let featuresDir = path.join(__dirname, 'features');
        await this._loadFeatures(featuresDir);
        this.configured = true;
        this.emit('configured');
    }

    /**
     * _loadCommands
     * 
     * @param {String} dir - directory to crawl through to load all commands
     */
    async _loadCommands(dir) {
        let files = await fs.readdir(dir);
        for (let i = 0; i < files.length; i++) {
            let elem = files[i];
            let elemPath = path.join(dir, elem);
            let stats = await fs.stat(elemPath);
            let isDirectory = stats.isDirectory();
            if (isDirectory)
                await this._loadCommands(elemPath);
            else {
                let [name, extension] = elem.split('.');
                if (extension === 'js')
                    this[name] = require(elemPath);
            }
        }
    }

    /**
     * _loadFeatures
     * 
     * @param {String} dir 
     */
    async _loadFeatures(dir) {
        let files = await fs.readdir(dir);
        for (let i = 0; i < files.length; i++) {
            let elem = files[i];
            let elemPath = path.join(dir, elem);
            let stats = await fs.stat(elemPath);
            let isDirectory = stats.isDirectory();
            if (isDirectory)
                await this._loadCommands(elemPath);
            else {
                let [name, extension] = elem.split('.');
                if (extension === 'js') {
                    let feature = require(elemPath);
                    this.features[name] = new feature(this);
                }
            }
        }
    }

    /**
     * start
     * 
     * @return {Promise}
     */
    async _start() {
        try {

            await this.use(this.config.serverID);

            if(this.config.nickname.length)
                await this.clientupdate({'client_nickname' : this.config.nickname});

            if(this.config.disableThrottle)
                this.query.throttle.set('enable', false);

            if (this.config.events.server) {
                await this.servernotifyregister('server');
                this.query.on('serveredited', (data) => {
                    this.emit('serveredited', data);
                });

                this.query.on('channeledited', (data) => {
                    this.emit('channeledited', data);
                });

                this.query.on('channeldescriptionchanged', (data) => {
                    this.emit('channeldescriptionchanged', data);
                });

                this.query.on('cliententerview', (data) => {
                    if (this.clientEnterViewBlocked[data.client_unique_identifier])
                        return;

                    this.clientEnterViewBlocked[data.client_unique_identifier] = true;

                    this.emit('cliententerview', data);

                    setTimeout(() => {
                        delete this.clientEnterViewBlocked[data.client_unique_identifier];
                    }, 1000);
                });

                this.query.on('clientleftview', (data) => {
                    this.emit('clientleftview', data);
                });
            }

            if (this.config.events.textprivate)
                await this.servernotifyregister('textprivate');

            if (this.config.events.textchannel)
                await this.servernotifyregister('textchannel');

            if (this.config.events.textserver)
                await this.servernotifyregister('textserver');

            if (this.config.events.textprivate || this.config.events.textchannel || this.config.events.textserver) {
                this.query.on('textmessage', (data) => {
                    if (data.invokername == this.config.nickname)
                        return;

                    this.emit('textmessage', data);
                });
            }

            this.query.keepalive.enable(false);
            this.connected = true;
            this.emit('ready');
        } catch (error) {
            this.connected = false;
            this._log(error);
        }
    }

    /**
     * _disconnect
     */
    async _disconnect() {
        try {
            await this.query.disconnect();
            this.connected = false;
        } catch (error) {
            this._log(error);
        }
    }
}

module.exports = ts3QueryClient;