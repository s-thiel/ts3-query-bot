'use strict';
const sshQuery = require('./src/ssh');
const telnetQuery = require('./src/telnet');

exports.ssh = sshQuery;
exports.telnet = telnetQuery