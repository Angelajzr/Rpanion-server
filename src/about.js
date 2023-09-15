import React from 'react'
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import basePage from './basePage.js'

class AboutPage extends basePage {
  constructor (props, useSocketIO = true) {
    super(props, useSocketIO)
    this.state = {
      OSVersion: '',
      Nodejsversion: '',
      rpanionversion: '',
      CPUName: '',
      RAMName: '',
      HATName: {},
      diskSpaceStatus: '',
      loading: true,
      error: null,
      infoMessage: null,
      showModal: false,
      showModalResult: "",
      UpgradeStatus: '',
      UpgradeIntStat: ''
    }

    this.upgradeTextContainer = React.createRef();

    //Socket.io client for reading in analog update values
    this.socket.on('upgradeText', function (msg) {
      const prevText = this.state.UpgradeStatus
      this.setState({ UpgradeStatus: (prevText + msg) })
    }.bind(this));
    this.socket.on('upgradeStatus', function (msg) {
      this.setState({ UpgradeIntStat: msg })
    }.bind(this));
    this.socket.on('reconnect', function () {
      //refresh state
      this.componentDidMount();
    }.bind(this));
  }

  componentDidMount () {
    fetch('/api/softwareinfo').then(response => response.json()).then(state => this.setState(state))
    fetch('/api/diskinfo').then(response => response.json()).then(state => this.setState(state))
    fetch('/api/hardwareinfo').then(response => response.json()).then(state => { this.setState(state); this.loadDone() })
  }

  confirmShutdown = (event) => {
    //user clicked the shutdown button
    // modal events take it from here
    this.setState({ showModal: true });
  }

  handleCloseModal = (event) => {
    // user does not want to shutdown
    this.setState({ showModal: false});
  }

  handleShutdown = (event) => {
    // user does want to shutdown
    this.setState({ showModal: false});
    fetch('/api/shutdowncc', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
  }

  handleUpdateMaster = (event) => {
    // update to latest github master
    fetch('/api/updatemaster', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
  }

  renderTitle () {
    return '关于'
  }

  HATInfo() {
      if (this.state.HATName.product !== "") {
        return <p>已连接的HAT: {this.state.HATName.product}, 制造商: {this.state.HATName.vendor}, 版本: {this.state.HATName.version}</p>;
      }
      return <p></p>;
    }

  renderContent () {
    return (
      <div>
        <h2>硬件信息</h2>
        <p>处理器: {this.state.CPUName}</p>
        <p>内存: {this.state.RAMName} GB</p>
        <p>磁盘空间: {this.state.diskSpaceStatus}</p>
        {this.HATInfo()}
        <h2>软件信息</h2>
        <p>操作系统主机名: {this.state.hostname}</p>
        <p>操作系统版本: {this.state.OSVersion}</p>
        <p>Node.js 版本: {this.state.Nodejsversion}</p>
        <p>Rpanion-server 版本: {this.state.rpanionversion}</p>
        <p><a href='./rplogs/app.log' download>下载 Rpanion-server 日志文件</a></p>
        <h2>Controls</h2>
        <p><Button size="sm" onClick={this.handleUpdateMaster}>升级到最新的Github主分支</Button></p>
        <p><Button size="sm" onClick={this.confirmShutdown}>关闭计算机</Button></p>

        <div style={{ display: (this.state.UpgradeIntStat === 'InProgress' || this.state.UpgradeIntStat === 'Complete') ? "block" : "none" }}>
          <h2>升级状态</h2>
          <div style={{ display: (this.state.UpgradeIntStat === 'InProgress') ? "block" : "none" }}>
            <p>正在进行升级 ... 请稍候</p>
          </div>
          <div style={{ display: (this.state.UpgradeIntStat === 'Complete') ? "block" : "none" }}>
            <p>升级完成</p>
          </div>
          <textarea ref={this.upgradeTextContainer} readOnly rows="20" cols="60" value={this.state.UpgradeStatus}></textarea>
        </div>
        

        <Modal show={this.state.showModal} onHide={this.handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>确认</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p>确定要关闭计算机吗？</p>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleShutdown}>Yes</Button>
            <Button variant="primary" onClick={this.handleCloseModal}>No</Button>
          </Modal.Footer>
        </Modal>

      </div>
    )
  }
}

export default AboutPage
