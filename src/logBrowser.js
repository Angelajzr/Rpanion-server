import React from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import basePage from './basePage.js';

import './css/styles.css';

class LoggerPage extends basePage {
  constructor (props, useSocketIO = true) {
    super(props, useSocketIO)
    this.state = {
      loading: false,
      waiting: false,
      TlogFiles: [],
      BinlogFiles: [],
      KMZlogFiles: [],
      logStatus: "",
      enablelogging: false,
      error: null,
      infoMessage: null,
      diskSpaceStatus: "",
      conversionLogStatus: 'N/A',
      doLogConversion: true
    }

    //Socket.io client for reading update values
    this.socket.on('LogConversionStatus', function (msg) {
      this.setState({ conversionLogStatus: msg })
    }.bind(this))
    this.socket.on('reconnect', function () {
      //refresh state
      this.componentDidMount()
    }.bind(this))
  }


  handleDoLogConversion = event => {
    //user clicked enable/disable log conversion
    fetch('/api/logconversion', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            doLogConversion: !this.state.doLogConversion,
        })
      }).then(response => response.json()).then(state => { this.setState(state) });
  }
  componentDidMount() {
    fetch(`/api/logfiles`).then(response => response.json()).then(state => { this.setState(state); this.loadDone() });
    fetch(`/api/diskinfo`).then(response => response.json()).then(state => { this.setState(state) });
    fetch(`/api/logconversioninfo`).then(response => response.json()).then(state => { this.setState(state); this.loadDone() })
  }

  renderTitle() {
    return "日志浏览";
  }

  //create a html table from a list of logfiles
  renderLogTableData(logfilelist) {
    return logfilelist.map((log, index) => {
      return (
        <tr key={log.key}>
          <td><a href={this.state.url + "/logdownload/" + log.key} download>{log.name}</a></td>
          <td>{log.size} KB</td>
          <td>{log.modified}</td>
        </tr>
      )
    });
  }

  clearLogs = (event) => {
    //this.setState((state) => ({ value: state.value + 1}));
    const id = event.target.id;
    this.setState({ waiting: true }, () => {
      fetch('/api/deletelogfiles', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logtype: id,
        })
      }).then(response => response.json())
        .then(result => {
          this.componentDidMount();
          this.setState({ waiting: false });
        })
        .catch(error => {
          this.setState({ waiting: false, error: "Error deleting logfiles: " + error });
        });
    });
    event.preventDefault();
  }

  startLog = (event) => {
    this.setState({ waiting: true }, () => {
      fetch('/api/newlogfile').then(response => response.json())
        .then(result => {
          this.componentDidMount();
          this.setState({ waiting: false });
        })
        .catch(error => {
          this.setState({ waiting: false, error: "Error creating logfile: " + error });
        });
    });
    event.preventDefault();
  }

  handleCheckboxChange = event => {
    //this.setState({enablelogging: !this.state.enablelogging});
    this.setState({ waiting: true }, () => {
      fetch('/api/logenable', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enable: !this.state.enablelogging,
        })
      }).then(response => response.json())
        .then(result => {
          this.componentDidMount();
          this.setState({ waiting: false });
        })
        .catch(error => {
          this.setState({ waiting: false, error: "Error setting logging: " + error });
        });
    });
    event.preventDefault();
  }

  renderContent() {
    return (
      <div style={{ width: 600 }}>
        <p><i>保存并下载飞行日志</i></p>
        <p>日志记录状态: {this.state.logStatus}</p>
        <p>磁盘空间: {this.state.diskSpaceStatus}</p>
        <h3>遥测日志</h3>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-5 col-form-label">启用遥测日志记录</label>
          <div className="col-sm-7">
          <input type="checkbox" checked={this.state.enablelogging} onChange={this.handleCheckboxChange} />
          </div>
        </div>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <div className="col-sm-8">
          <Button onClick={this.startLog}>开始新的遥测日志记录</Button>{'   '}
          <Button id='tlog' onClick={this.clearLogs}>清除非活动日志</Button>
          </div>
        </div>
        <Table id='Tlogfile' striped bordered hover size="sm">
          <thead>
            <tr><th>文件名</th><th>大小</th><th>修改时间</th></tr>
          </thead>
          <tbody>
            {this.renderLogTableData(this.state.TlogFiles)}
          </tbody>
        </Table>
        <br />
        <h3>Bin 日志</h3>
        <p>这需要在ArduPilot中将<code>LOG_BACKEND_TYPE</code> 参数设置为 <code>Mavlink</code>。需要对飞行控制器使用高波特率(921500或更高)。</p>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <div className="col-sm-8">
          <Button id='binlog' onClick={this.clearLogs}>清除非活动日志</Button>
          </div>
        </div>
        <Table id='Binlogfile' striped bordered hover size="sm">
          <thead>
            <tr><th>文件名</th><th>大小</th><th>修改时间</th></tr>
          </thead>
          <tbody>
            {this.renderLogTableData(this.state.BinlogFiles)}
          </tbody>
        </Table>
        <br />
        <h3>KMZ 文件</h3>
        <p>每20秒从遥测日志创建一个KMZ文件。</p>
        
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <div className="col-sm-8">
            <Button onClick={this.handleDoLogConversion} className="btn btn-primary">{this.state.doLogConversion === true ? '禁用' : '启用'}</Button>
          </div>
        </div>
        <p>状态: {this.state.conversionLogStatus}</p>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <div className="col-sm-8">
          <Button id='kmzlog' onClick={this.clearLogs}>清除KMZ文件</Button>
          </div>
        </div>
        <Table id='KMZlogfile' striped bordered hover size="sm">
          <thead>
            <tr><th>文件名</th><th>大小</th><th>修改时间</th></tr>
          </thead>
          <tbody>
            {this.renderLogTableData(this.state.KMZlogFiles)}
          </tbody>
        </Table>
        <br />
      </div>
    );
  }
}


export default LoggerPage;
