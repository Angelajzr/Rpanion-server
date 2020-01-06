const SerialPort = require('serialport');
const fs = require('fs');
const path = require('path');
var events = require('events');
var winston = require('./winstonconfig')(module);

const mavManager = require('../mavlink/mavManager.js');

class FCDetails {
    constructor() {
        this.active = false;
        this.serialDevices = [];
        this.baudRates = [{value: 9600, label: '9600'},
                          {value: 19200, label: '19200'},
                          {value: 38400, label: '38400'},
                          {value: 57600, label: '57600'},
                          {value: 115200, label: '115200'},
                          {value: 230400, label: '230400'},
                          {value: 460800, label: '460800'},
                          {value: 921600, label: '921600'}];
        this.mavlinkVersions = [{value: 1, label: '1.0'},
                                {value: 2, label: '2.0'}];
        this.filesavepath = path.join(".", 'FCSettings.json');
        this.activeDevice = null;
        this.port = null;
        this.m = null;

        //For sending events outside of object
        this.eventEmitter = new events.EventEmitter();

        //Tracking time of last packet recived
        this.lastDataTime = (Date.now().valueOf());
        this.intervalObj = null;

        //UDP Outputs
        this.outputs = [];

        //find all serial devices
        this.getSerialDevicesSync();

        //load the FCSettings.json, if it exists
        fs.readFile(this.filesavepath, (err, data) => {
            if (err) {
                console.log("No saved file " + this.filesavepath);
                winston.error('Error in constructor() ', { message: err });
            }
            else {
                try {
                    [this.activeDevice, this.outputs] = JSON.parse(data);
                    if (this.activeDevice !== null) {
                        //restart link if saved serial device is found
                        this.getSerialDevices((err, devices, bauds, seldevice, selbaud, active) => {
                            for (var i = 0, len = devices.length; i < len; i++) {
                                if (this.activeDevice.serial.value === devices[i].value) {
                                    this.startLink((err) => {
                                        if (!this.active) {
                                            console.log("Can't open found FC " + this.activeDevice.serial.value + ", resetting link");
                                            this.activeDevice = null;
                                        }
                                    });
                                    break;
                                }
                            }
                            if (this.port === null) {
                                console.log("Can't find saved FC, resetting");
                                this.activeDevice = null;
                            }
                        });

                    }
                    console.log(this.filesavepath + ' read');
                } catch(err) {
                    console.log("Cannot read " + this.filesavepath);
                    winston.error('Error in constructor() catch ', { message: err });
                    console.log(err);
                }

            }
        });
    }

    getUDPOutputs() {
        //get list of current UDP outputs
        var ret = [];
        for (var i = 0, len = this.outputs.length; i < len; i++) {
            ret.push({IPPort: this.outputs[i].IP + ":" + this.outputs[i].port});
        }
        return ret;
    }

    addUDPOutput(newIP, newPort) {
        //add a new udp output, if not already in
        //check if this ip:port is already in the list
        for (var i = 0, len = this.outputs.length; i < len; i++) {
            if (this.outputs[i].IP == newIP && this.outputs[i].port == newPort) {
                return this.getUDPOutputs();
            }
        }
        //add it in
        this.outputs.push({IP: newIP, port: newPort});
        console.log("Added UDP Output " + newIP + ":" + newPort);

        //restart udp outputs, if link active
        if (this.m) {
            this.m.restartUDP(this.outputs);
        }

        this.saveSerialSettings();
        return this.getUDPOutputs();
    }

    removeUDPOutput(remIP, remPort) {
        //remove new udp output
        //check if this ip:port is already in the list
        for (var i = 0, len = this.outputs.length; i < len; i++) {
            if (this.outputs[i].IP == remIP && this.outputs[i].port == remPort) {
                //and remove
                this.outputs.splice(i, 1);
                console.log("Removed UDP Output " + remIP + ":" + remPort);

                //restart udp outputs, if link active
                if (this.m) {
                    this.m.restartUDP(this.outputs);
                }

                this.saveSerialSettings();
                return this.getUDPOutputs();
            }
        }

        return this.getUDPOutputs();
    }

    getSystemStatus() {
        //get the system status
        if (this.m !== null) {
            return {numpackets: this.m.statusNumRxPackets,
                    FW: this.m.autopilotFromID(),
                    vehType: this.m.vehicleFromID(),
                    conStatus: this.m.conStatus(),
                    statusText: this.m.statusText};
        }
        else {
            return {numpackets: 0,
                    FW: "",
                    vehType: "",
                    conStatus: "Not connected",
                    statusText: ""};
        }
    }

    rebootFC() {
        //command the flight controller to reboot
        if (this.m !== null) {
            console.log("Rebooting FC");
            this.m.sendReboot();
        }
    }

    checkConnected() {
        //check if the FC is still connected, if not try reconnecting
        if (this.port && !this.port.isOpen && this.active) {
            this.startLink();
        }
    }

    startLink(callback) {
        //start the serial link
        console.log("Opening Link " + this.activeDevice.serial.value + " @ " + this.activeDevice.baud.value + ", MAV v" + this.activeDevice.mavversion.value);
        this.port = new SerialPort(this.activeDevice.serial.value, {baudRate: parseInt(this.activeDevice.baud.value)}, (err) => {
            if (err) {
                this.closeLink((err) => {
                    winston.error('Error in startLink() port ', { message: err });
                });
                console.log('Serial Error: ', err.message);
                this.active = false;
                return callback(err.message, false)
            }
            this.active = true;
            this.m = new mavManager(this.activeDevice.mavversion.value, this.outputs);

            //timeout func
            this.lastDataTime = (Date.now().valueOf());
            this.intervalObj = setInterval(() => {
                //check for timeouts in serial link
                if (this.m.isRebooting && this.active && (Date.now().valueOf()) - this.lastDataTime > 2000) {
                    console.log('Trying to reconnect FC...');
                    this.closeLink((err) => {
                        winston.error('Error in startLink() timeout ', { message: err });
                        this.startLink((err) => {
                        });
                    });
                }
                else if (this.m.statusNumRxPackets == 0) {
                    //waiting for initial connection
                    console.log("Sending DS");
                    this.m.sendDSRequest();
                }
            }, 1000);
            this.m.eventEmitter.on('sendData', (buffer) => {
                if (this.port) {
                    this.port.write(buffer, function(err) {
                      if (err) {
                          winston.error('Error in startLink() serial ', { message: err });
                        return console.log('FC Serial Error on write: ', err.message)
                      }
                    });
                }
            });
            //this.m.eventEmitter.on('gotData', (msg) => {
            //    //got valid message - send on
            //    this.eventEmitter.emit('gotData', msg);
            //});

            return callback(null, true)
        });
        // Switches the port into "flowing mode"
        this.port.on('data', (data) => {
            this.lastDataTime = (Date.now().valueOf());
            this.m.parseBuffer(data);
        });
    }

    closeLink(callback) {
        //stop the serial link
        if (this.port && this.port.isOpen) {
            this.port.close();
            this.active = false;
            console.log("Closed Serial");
            this.m = null;
            clearInterval(this.intervalObj);
            return callback(null)
        }
        else if (this.port) {
            this.active = false;
            console.log("Already Closed Serial");
            this.m = null;
            clearInterval(this.intervalObj);
            return callback(null)
        }
    }

    getSerialDevicesSync(){
        //synchonous version of getSerialDevices()
        var ret;
        this.getSerialDevices((err, devices, bauds, seldevice, selbaud, active) => {
            ret = devices;
        });
        while(ret === undefined) {
            require('deasync').sleep(100);
        }
        //return ret;
    }

    getSerialDevices(callback) {
        //get all serial devices
        this.serialDevices = [];

        SerialPort.list((err, ports) => {
            for (var i = 0, len = ports.length; i < len; i++) {
                if (ports[i].pnpId !== undefined) {

                    //usb-ArduPilot_Pixhawk1-1M_32002A000847323433353231-if00
                    //console.log("Port: ", ports[i].pnpID);
                    if (ports[i].pnpId.split("_").length > 2) {
                        var name = ports[i].pnpId.split("_")[1] + " (" + ports[i].comName + ")";
                    }
                    else {
                        var name = ports[i].manufacturer + " (" + ports[i].comName + ")";
                    }
                    //console.log("Port: ", ports[i].pnpID);
                    this.serialDevices.push({value: ports[i].comName, label: name, pnp: ports[i].pnpId});
                }
            }
            //for the Ras Pi's inbuilt UART
            if (fs.existsSync('/dev/serial0')) {
                this.serialDevices.push({value: '/dev/serial0', label: '/dev/serial0', pnp: ''});
            }

            //has the active device been disconnected?
            if (this.port && !this.port.isOpen) {
                console.log("Lost active device");
                this.active = false;
                this.m = null;
            }
            //set the active device as selected
            if (this.active) {
                return callback(null, this.serialDevices, this.baudRates, this.activeDevice.serial, this.activeDevice.baud, this.mavlinkVersions, this.activeDevice.mavversion, true);
            }
            else if (this.serialDevices.length > 0){
                return callback(null, this.serialDevices, this.baudRates, this.serialDevices[0], this.baudRates[0], this.mavlinkVersions, this.mavlinkVersions[0], false);
            }
            else {
                return callback(null, this.serialDevices, this.baudRates, [], this.baudRates[0], this.mavlinkVersions, this.mavlinkVersions[0], false);
            }
        });
    }

    startStopTelemetry(device, baud, mavversion, callback) {
        //user wants to start or stop telemetry
        //callback is (err, isSuccessful)

        //check port, mavversion and baud are valid (if starting telem)
        if(!this.active) {
            this.activeDevice = {serial: null, baud: null};
            for (var i = 0, len = this.serialDevices.length; i < len; i++) {
                if (this.serialDevices[i].pnpId === device.pnpId) {
                    this.activeDevice.serial = this.serialDevices[i];
                    break;
                }
            }
            for (i = 0, len = this.baudRates.length; i < len; i++) {
                if (this.baudRates[i].value === baud.value) {
                    this.activeDevice.baud = this.baudRates[i];
                    break;
                }
            }
            for (i = 0, len = this.mavlinkVersions.length; i < len; i++) {
                if (this.mavlinkVersions[i].value === mavversion.value) {
                    this.activeDevice.mavversion = this.mavlinkVersions[i];
                    break;
                }
            }

            if (this.activeDevice.baud === null || this.activeDevice.serial === null || this.activeDevice.mavversion === null) {
                return callback("Bad serial device or baud or mavlink version", this.active);
            }

            //this.activeDevice = {serial: device, baud: baud};
            this.startLink((err) => {
                this.saveSerialSettings();
                return callback(null, this.active);
            });
        }
        else {
            this.activeDevice = null;
            this.closeLink((err) => {
                this.saveSerialSettings();
                return callback(null, this.active);
            });
        }

    }

    saveSerialSettings() {
        //Save the current settings to file
        let data = JSON.stringify([this.activeDevice, this.outputs]);

        fs.writeFile(this.filesavepath, data, (err) => {
            if (err) {
                winston.error('Error in saveSerialSettings() ', { message: err });
            }
            else {
                console.log(this.filesavepath + ' written');
            }
        });
    }

}

module.exports = FCDetails;
