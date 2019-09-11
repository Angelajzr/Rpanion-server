const {exec} = require('child_process');
const fs = require('fs');

function getAnalogReading(callback) {
    //read all the analog ports on the MCP3008 via commandline
    var ret = [];
    var haveReturned = false;
    //[{ port: "A0", mv: 2.56, number: 677}, { port: "A1", mv: 2.45, number: 567}]
    // first check if the ports exist
    if (!fs.existsSync('/sys/bus/iio/devices/iio\\:device0/')) {
        return callback(new Error("No MCP3008 Detected"), []);
    }
    for (var i = 0; i < 8; i++) {
        exec('echo '+i.toString()+'; cat /sys/bus/iio/devices/iio\\:device0/in_voltage'+i.toString()+'_raw', (error, stdout, stderr) => {
            if (stderr) {
                console.log(`exec error: ${stderr}`);
            }
            else {
                // add a new analog reading to the return object
                var reading = parseInt(stdout.split('\n')[1]);
                var port = stdout.split('\n')[0];
                var tmp = { port: "A"+port, mv: Math.round(reading*(3300/1023)), number: reading}
                ret.push(tmp);
            }
            if (ret.length == 8) {
                // we've got all the readings, can return now
                haveReturned = true
                return callback(null, ret);
            }
        });
    }
    // we couldn't get all 8 ADC Channels
    if (haveReturned === false) {
        return callback(new Error("Error getting all ADC Channels: " + ret.toString()), []);
    }
}

module.exports = {getAnalogReading}
