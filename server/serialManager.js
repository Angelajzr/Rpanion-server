//require('use-strict')
const fs = require('fs');
var path = require('path');
const os = require('os');
const SerialPort = require('serialport');
const TCPLink = require('./TCPLink');
const UDPLink = require('./UDPLink');
//var deasync = require('deasync');
//Class for manager serial port <-> IP streaming

class serialManager {
    constructor() {
        //this.portA = {name: "COM17", baud: 57600, contype: "TCP", conIP: "0.0.0.0", conPort: 14550, status: "Started"};
        //this.portB = {name: "COM10", baud: 9600, contype: "UDP", conIP: "192.168.0.1", conPort: 15000, status: "Started"};
        this.iface = [];
        this.ports = [];
        
        this.activeLinks = [];
        
        this.filesavepath = path.join(".", 'serialSettings.json')
        
        this.scanInterfaces();
        
        //load the serial.json, if it exists
        fs.readFile(this.filesavepath, (err, data) => {
            if (err) {
                console.log("No " + this.filesavepath);
            }
            else {
                try {
                    this.ports = JSON.parse(data);
                    console.log(this.filesavepath + ' read');
                } catch(err) {
                    console.log("Cannot read" + this.filesavepath);
                    this.ports = [];
                }
                
            }
            
            //check the loaded settings against the current config
            // ie valid ports and IP's
            this.ports = this.SyncScanSerial(this.ports, this.iface);
            console.log("There are " + this.ports.length + " valid ports");
            for (var i = 0; i < this.ports.length; i++) {
                if (this.ports[i].status == 'Started') {
					console.log("Starting saved link " + this.ports[i].name);
                    this.startLink(this.ports[i].name, this.ports[i].baud, this.ports[i].contype, this.ports[i].conIP, this.ports[i].conPort);
                }
            }
        });
        
    }
    
    updateLinkSettings(newPortInfo) {
        //update the settings for 1 port
        //start/stop as required
        //if started and settings changed, stop, change start
        //save to file
        for (var i = 0; i < this.ports.length; i++) {
          if (this.ports[i].name == newPortInfo.name) {
              this.ports[i][newPortInfo.field] = newPortInfo.newValue;
              console.log("Changing settings for " + this.ports[i].name + "." + newPortInfo.field);
              //and save to file
              this.saveSerialSettings();
              if (this.ports[i].status == "Started") {
                  //stop-then-start link
                if(this.ports[i].name in this.activeLinks) {
                    this.stopLink(this.ports[i].name);
                }
                require('deasync').sleep(200);
                this.startLink(this.ports[i].name, this.ports[i].baud, this.ports[i].contype, this.ports[i].conIP, this.ports[i].conPort);
              }
              //stop link if active
              if (this.ports[i].status == "Stopped" && this.ports[i].name in this.activeLinks) {
                  this.stopLink(this.ports[i].name);
              }
          }        
        }
    }
    
    stopLink(port) {
        //close down a particular link
        
        //first check if we've already got an active link
        if(!(port in this.activeLinks)) {
            console.log('Link not active');
            return;
        }
        console.log('Stopped link for ' + port);
        this.activeLinks[port].closeLink();
        delete this.activeLinks[port];     
        
    }
    
    startLink(port, baud, type, ip, ipport) {
        //Start a serial <-> IP link
        
        //first check if we've already got an active link
        if(port in this.activeLinks) {
            console.log('Link already in Manager');
            return;
        }
        if (type == 'TCP') {
            this.activeLinks[port] = new TCPLink(port, baud, ip, ipport);
            console.log('Started TCP link for ' + port);
        }
        else if (type == 'UDP') {
            this.activeLinks[port] = new UDPLink(port, baud, ip, ipport);
            console.log('Started UDP link for ' + port);
        }
        
    }

    SyncScanSerial(inPorts, ifaces){
        //synchonous version of scanSerial()
        var ret;
      this.scanSerial(inPorts, ifaces).then( function(ports, err){
          ret = ports;
      });
      while(ret === undefined) {
        require('deasync').sleep(100);
      }
      // returns hello with sleep; undefined without
      return ret;    
    }
    
    scanSerial(inPorts, ifaces, errcallback) {
        //Get the serial ports and add to this.ports
        //assumes the serialSettings.json is already read in
        //var scanports = ["COM10", "COM5"];
        return new Promise(function(resolve, reject) {
        SerialPort.list().then( function(ports, err) {
            var ret = [];
            var retForm = []
            for (const portID in ports) {
                console.log("Found port " + ports[portID].comName);
                ret.push(ports[portID].comName)
            }
            for (var i = 0; i < ret.length; i++) {
                //add in ports, with metadata if found in inPorts
                var added = false;
                for (var j = 0; j < inPorts.length; j++) {
                    if (inPorts[j].name == ret[j]) {
                        retForm.push(inPorts[i]);
                        console.log("Adding existing port " + ret[i]);
                        added = true;
                    }
                }
                //if not in this.ports, add it in as a new port
                if (!added) {
                    retForm.push({name: ret[i], baud: 115200, contype: "UDP", conIP: ifaces[0].value, conPort: 15000, status: "Stopped"});
                    console.log("Adding new port " + ret[i]);
                }
            }
            //reset any ifaces that are not valid
            for (var i = 0; i < retForm.length; i++) {
                var goodIP = false;
                for (var j = 0; j < ifaces.length; j++) {
                    if (ifaces[j].value == retForm[i].conIP) {
                        goodIP = true;
                    }
                }
                if (!goodIP) {
                    //iface no longer exists, reset it        
                    console.log("Resetting IP for port " + retForm[i].name);
                    retForm[i].conIP = ifaces[0].value;
                    retForm[i].status = "Stopped";
                }
            }

            resolve(retForm);
        });
    });


    }
    
    scanInterfaces() {
        //scan for available IP (v4 only) interfaces
        var ifaces = os.networkInterfaces();
        
        for (const ifacename in ifaces) {
            var alias = 0;
            for (var j = 0; j < ifaces[ifacename].length; j++) {
                if ('IPv4' == ifaces[ifacename][j].family && alias >= 1) {
                  // this single interface has multiple ipv4 addresses
                  console.log("Found IP " + ifacename + ':' + alias, ifaces[ifacename][j].address);
                  this.iface.push({value: ifaces[ifacename][j].address, label: ifaces[ifacename][j].address});
                } else if ('IPv4' == ifaces[ifacename][j].family) {
                  // this interface has only one ipv4 adress
                  console.log("Found IP " + ifacename, ifaces[ifacename][j].address);
                  this.iface.push({value: ifaces[ifacename][j].address, label: ifaces[ifacename][j].address});
                }
                ++alias;
            }
        }
    }
    
    saveSerialSettings() {
        //Save the current settings to file
        let data = JSON.stringify(this.ports);
        
        fs.writeFile(this.filesavepath, data, (err) => {
            if (err) throw err;
            console.log(this.filesavepath + ' written');
        });
    }
}

module.exports = serialManager
