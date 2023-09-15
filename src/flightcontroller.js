//有bug，还没修完
import React from 'react';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import basePage from './basePage.js';

import './css/styles.css';

class FCPage extends basePage {
  constructor(props, useSocketIO = true) {
    super(props, useSocketIO);
    this.state = {
      telemetryStatus: this.props.telemetryStatus,
      serialPorts: [],
      baudRates: [],
      mavVersions: [],
      serialPortSelected: null,
      baudRateSelected: null,
      mavVersionSelected: null,
      enableTCP: null,
      FCStatus: {},
      UDPoutputs: [],
      addrow: "",
      loading: true,
      error: null,
      infoMessage: null,
      socketioStatus: false,
      usedSocketIO: true,
      enableUDPB: false,
      UDPBPort: 14550,
      enableDSRequest: false
    }

    // Socket.io client for reading in analog update values
    this.socket.on('FCStatus', function (msg) {
      this.setState({ FCStatus: msg });
    }.bind(this));
    this.socket.on('reconnect', function () {
      //refresh state
      this.componentDidMount();
    }.bind(this));
  }

  componentDidMount() {
    fetch(`/api/FCDetails`).then(response => response.json()).then(state => { this.setState(state) });
    fetch(`/api/FCOutputs`).then(response => response.json()).then(state => { this.setState(state); this.loadDone() });
  }

  handleSerialPortChange = (value, action) => {
    this.setState({ serialPortSelected: value });
  }

  handleBaudRateChange = (value, action) => {
    this.setState({ baudRateSelected: value });
  }

  handleMavVersionChange = (value, action) => {
    this.setState({ mavVersionSelected: value });
  }

  handleUseTCPChange = (event) => {
    this.setState({ enableTCP: event.target.checked });
  }

  handleDSRequest = (event) => {
    this.setState({ enableDSRequest: event.target.checked });
  }

  handleUseUDPBChange = (event) => {
    this.setState({ enableUDPB: event.target.checked });
  }

  changeUDPBPort = (event) => {
    this.setState({ UDPBPort: event.target.value });
  }

  handleSubmit = (event) => {
    //user clicked start/stop telemetry
    fetch('/api/FCModify', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device: JSON.stringify(this.state.serialPortSelected),
        baud: JSON.stringify(this.state.baudRateSelected),
        mavversion: JSON.stringify(this.state.mavVersionSelected),
        enableTCP: this.state.enableTCP,
        enableUDPB: this.state.enableUDPB,
        UDPBPort: this.state.UDPBPort,
        enableDSRequest: this.state.enableDSRequest
      })
    }).then(response => response.json()).then(state => { this.setState(state) });
  }

  handleFCReboot = (event) => {
    //user clicked to reboot flight controller
    fetch('/api/FCReboot', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
  }

  addUdpOutput = (event) => {
    //add a new udp output
    fetch('/api/addudpoutput', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newoutputIP: this.state.addrow.split(":")[0],
        newoutputPort: this.state.addrow.split(":")[1]
      })
    }).then(response => response.json()).then(state => { this.setState(state) })
  }

  removeUdpOutput = (val) => {
    //remove a udp output
    fetch('/api/removeudpoutput', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeoutputIP: val.IPPort.split(":")[0],
        removeoutputPort: val.IPPort.split(":")[1]
      })
    }).then(response => response.json()).then(state => { this.setState(state) })
  }

  changeaddrow = event => {
    const value = event.target.value;
    this.setState({ addrow: value });
  }

  renderTitle() {
    return "飞控信息";
  }

  //create a html table from a list of udpoutputs
  renderUDPTableData(udplist) {
    return udplist.map((output, index) => {
      return (
        <tr key={index}>
          <td>{output.IPPort}</td>
          <td><Button size="sm" id={index} onClick={() => this.removeUdpOutput(output)}>Delete</Button></td>
        </tr>
      )
    });
  }

  renderContent() {
    return (
      <div style={{ width: 600 }}>
        <h2>串行输入</h2>
        <p><i>飞行控制器连接到此设备</i></p>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">串行设备</label>
          <div className="col-sm-8">
            <Select isDisabled={this.state.telemetryStatus} onChange={this.handleSerialPortChange} options={this.state.serialPorts} value={this.state.serialPortSelected} />
          </div>
        </div>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">波特率</label>
          <div className="col-sm-8">
            <Select isDisabled={this.state.telemetryStatus} onChange={this.handleBaudRateChange} options={this.state.baudRates} value={this.state.baudRateSelected} />
          </div>
        </div>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">MAVLink版本</label>
          <div className="col-sm-8">
            <Select isDisabled={this.state.telemetryStatus} onChange={this.handleMavVersionChange} options={this.state.mavVersions} value={this.state.mavVersionSelected} />
          </div>
        </div>

        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <div className="col-sm-8">
            <Button disabled={this.state.serialPorts.length === 0} onClick={this.handleSubmit}>{this.state.telemetryStatus ? "停止遥测" : "开始遥测"}</Button>
          </div>
        </div>

        <br />
        <h2>遥测目标</h2>
        <h3>UDP 客户端</h3>
        <p><i>将遥测发送到这些特定设备的IP:端口</i></p>
        <Table id='UDPOut' striped bordered hover size="sm">
          <thead>
            <tr><th>Destination IP:Port</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr key={this.state.UDPoutputs.length}><td>127.0.0.1:14540</td><td><i>Required for Rpanion-server</i></td></tr>
            {this.renderUDPTableData(this.state.UDPoutputs)}
          </tbody>
        </Table>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">添加新地址</label>
          <div className="col-sm-8">
            <input type="text" onChange={this.changeaddrow} value={this.state.addrow} /><Button size="sm" onClick={this.addUdpOutput}>Add</Button>
          </div>
        </div>
        <br />
        <h3>UDP 服务</h3>
        <p><i>允许其他设备借助UDP协议通过“IP地址:端口”连接到本设备</i></p>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">启用 UDP 服务</label>
          <div className="col-sm-8">
            <input type="checkbox" checked={this.state.enableUDPB} disabled={this.state.telemetryStatus} onChange={this.handleUseUDPBChange} />
            </div>
        </div>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">UDP 服务端口</label>
          <div className="col-sm-8">
            <input type="number" min="1000" max="20000" step="1" onChange={this.changeUDPBPort} value={this.state.UDPBPort} disabled={!this.state.enableUDPB || this.state.telemetryStatus} />
          </div>
        </div>
        <br />
        <h3>TCP 服务</h3>
        <p><i>允许其他设备借助TCP协议通过“IP地址:端口”连接到本设备</i></p>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-5 col-form-label">在5760端口启动TCP客户端</label>
          <div className="col-sm-7">
          <input type="checkbox" checked={this.state.enableTCP} disabled={this.state.telemetryStatus} onChange={this.handleUseTCPChange} />
          </div>
        </div>
        <br />
        <h2>其他选项</h2>
        <p><i>允许Rpanion-server发送数据流请求。如果未连接GCS,则需要此功能。</i></p>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-5 col-form-label">Enable datastream requests</label>
          <div className="col-sm-7">
          <input type="checkbox" checked={this.state.enableDSRequest} disabled={this.state.telemetryStatus} onChange={this.handleDSRequest} />
          </div>
        </div>
        <br />
        <h2>飞行控制器状态</h2>
        <p>收到的数据包: {this.state.FCStatus.numpackets} ({this.state.FCStatus.byteRate} bytes/sec)</p>
        <p>连接状态: {this.state.FCStatus.conStatus}</p>
        <p>载具类型: {this.state.FCStatus.vehType}</p>
        <p>固件版本: {this.state.FCStatus.FW}{this.state.FCStatus.fcVersion === '' ? '' : (', Version: ' + this.state.FCStatus.fcVersion)}</p>
        <label>命令行输出:
          <textarea readOnly rows="5" cols="50" value={this.state.FCStatus.statusText}></textarea>
        </label>
        <br />
        <Button size="sm" disabled={!this.state.telemetryStatus} onClick={this.handleFCReboot}>重启飞控</Button>
      </div>
    );
  }
}


export default FCPage;
