/*
Page for configuring Ad-hoc Wifi
This is seperate from the network config page due to conflicts
with nmcli used on network config
*/
import React from 'react';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import basePage from './basePage.js';

import './css/styles.css';

class AdhocConfig extends basePage {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      error: null,
      infoMessage: null,
      showPW: false,
      netDevice: [],
      netDeviceSelected: null,
      wpaTypes: [{ value: 'none', text: 'None' }, { value: 'wep', text: 'WEP' }],
      bandTypes: [{ value: 'bg', text: '2.4 GHz' }],
      curSettings: {
        ipaddress: '192.168.1.1',
        wpaType: 'none',
        password: '',
        ssid: '',
        band: 'bg',
        channel: 0,
        isActive: false
      }
    };

  }

  componentDidMount() {
    this.handleStart();
  }

  handleStart() {
    // Fetch the network information and send to controls
    this.setState({ loading: true });
    Promise.all([
      fetch(`/api/adhocadapters`).then(response => response.json()).then(state => { this.setState(state); return state; })
    ]).then(retState => { this.loadDone() });
  }

  getValidChannels() {
    // filter valid wifi channels
    var opt = [];
    for (var i = 0, len = this.state.netDeviceSelected.channels.length; i < len; i++) {
      if (this.state.netDeviceSelected.channels[i].band === this.state.curSettings.band || this.state.netDeviceSelected.channels[i].band === 0) {
        opt.push(this.state.netDeviceSelected.channels[i]);
      }
    }
    return opt;
  }

  IPHandler = event => {
    let items = this.state.curSettings;
    items.ipaddress = event.target.value;
    this.setState({ curSettings: items });
  }

  SSIDhandler = event => {
    let items = this.state.curSettings;
    items.ssid = event.target.value;
    this.setState({ curSettings: items });
  }

  passwordhandler = event => {
    let items = this.state.curSettings;
    items.password = event.target.value;
    this.setState({ curSettings: items });
  }

  bandhandler = event => {
    let items = this.state.curSettings;
    items.band = event.target.value;
    this.setState({ curSettings: items });
  }

  channelhandler = event => {
    let items = this.state.curSettings;
    items.channel = event.target.value;
    this.setState({ curSettings: items });
  }

  securityhandler = event => {
    let items = this.state.curSettings;
    items.wpaType = event.target.value;
    this.setState({ curSettings: items });
  }

  togglePasswordVisible = event => {
    this.setState({ showPW: event.target.checked });
  }

  handleadhocSubmit = event => {
    //user clicked enable/disable adhoc wifi
    this.setState({ waiting: true }, () => {
      fetch('/api/adhocadaptermodify', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          netDeviceSelected: this.state.netDeviceSelected.value,
          settings: this.state.curSettings,
          toState: !this.state.curSettings.isActive,
        })
      }).then(response => response.json())
        .then(data => {
          if (data.error == null) {
            this.setState({ waiting: false, infoMessage: this.state.curSettings.isActive ? "Network Deactivated" : "Network Activated" });
          }
          else {
            this.setState({ waiting: false, error: "Error: " + data.error });
          }
          //and refresh connections list
          this.handleStart()
        })
        .catch(error => {
          this.setState({ waiting: false, error: "Error: " + error });
        });
    });

  }


  renderTitle() {
    return 'Adhoc Wifi 配置'
  }

  renderContent() {
    return (
      <div>
        <div style={{ display: (this.state.netDeviceSelected !== null) ? "block" : "none" }}>
          <Form style={{ width: 600 }}>
            <div className="form-group row" style={{ marginBottom: '0px' }}>
              <label className="col-sm-2 col-form-label">适配器</label>
              <div className="col-sm-10">
                <Select disabled={this.state.curSettings.isActive} onChange={this.handleAdapterChange} options={this.state.netDevice} value={this.state.netDeviceSelected} />
              </div>
            </div>
            <div className="form-group row" style={{ marginBottom: '0px' }}>
              <label className="col-sm-2 col-form-label">SSID</label>
              <div className="col-sm-10">
                <input disabled={this.state.curSettings.isActive} name="ssid" onChange={this.SSIDhandler} value={this.state.curSettings.ssid} type="text" />
              </div>
            </div>
            <div className="form-group row" style={{ marginBottom: '0px' }}>
              <label className="col-sm-2 col-form-label">频段</label>
              <div className="col-sm-10">
                <select disabled={this.state.curSettings.isActive} name="band" onChange={this.bandhandler} value={this.state.curSettings.band}>
                  {this.state.bandTypes.map((option, index) => (
                    <option key={option.value} value={option.value}>{option.text}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group row" style={{ marginBottom: '0px' }}>
              <label className="col-sm-2 col-form-label">信道</label>
              <div className="col-sm-10">
                <select disabled={this.state.curSettings.isActive} name="channel" onChange={this.channelhandler} value={this.state.curSettings.channel}>
                  {this.state.netDeviceSelected !== null ? this.getValidChannels().map((option, index) => (
                    <option key={option.value} value={option.value}>{option.text}</option>
                  )) : <option></option>}
                </select>
              </div>
            </div>
            <div className="form-group row" style={{ marginBottom: '0px' }}>
              <label className="col-sm-2 col-form-label">安全性</label>
              <div className="col-sm-10">
                <select disabled={this.state.curSettings.isActive} name="wpaType" value={this.state.curSettings.wpaType} onChange={this.securityhandler}>
                  {this.state.wpaTypes.map((option, index) => (
                    <option key={option.value} value={option.value}>{option.text}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group row" style={{ marginBottom: '0px' }}>
              <label className="col-sm-2 col-form-label">密码</label>
              <div className="col-sm-10">
                <input disabled={this.state.curSettings.isActive || this.state.wpaType === "none"} name="password" type={this.state.showPW === true ? "text" : "password"} value={this.state.curSettings.wpaType === "none" ? '' : this.state.curSettings.password} onChange={this.passwordhandler} />
                <label><input name="showpassword" type="checkbox" checked={this.state.showPW} disabled={this.state.curSettings.wpaType === "wpa-none"} onChange={this.togglePasswordVisible} />显示密码</label>
              </div>
            </div>
            <div className="form-group row" style={{ marginBottom: '0px' }}>
              <label className="col-sm-2 col-form-label">IP地址</label>
              <div className="col-sm-10">
                {/* <IPut className="ipaddress" disabled={this.state.curSettings.isActive} onChange={this.IPHandler} defaultValue={this.state.curSettings.ipaddress} value={this.state.curSettings.ipaddress} /> */}
                <input name="ipaddress" disabled={this.state.curSettings.isActive} onChange={this.IPHandler} value={this.state.curSettings.ipaddress} type="text" />
              </div>
            </div>
            <div className="form-group row" style={{ marginBottom: '5px' }}>
              <div className="col-sm-10">
                <Button onClick={this.handleadhocSubmit} disabled={this.state.netDeviceSelected === null} className="btn btn-primary">{this.state.curSettings.isActive ? "禁用" : "启用"}</Button>
              </div>
            </div>
          </Form>
        </div>
        <div style={{ display: (this.state.netDeviceSelected === null) ? "block" : "none" }}>
          <p>未检测到无线适配器</p>
        </div>
      </div>
    );
  }
}

export default AdhocConfig;
