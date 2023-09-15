import React from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

import basePage from './basePage.js'

import './css/styles.css'

class CloudConfig extends basePage {
  constructor (props, useSocketIO = true) {
    super(props, useSocketIO)
    this.state = {
      loading: true,
      waiting: false,
      error: null,
      infoMessage: null,
      doBinUpload: false,
      binUploadLink: '',
      binLogStatus: 'N/A',
      syncDeletions: false,
      pubkey: []
    }

    //Socket.io client for reading in analog update values
    this.socket.on('CloudBinStatus', function (msg) {
      this.setState({ binLogStatus: msg })
    }.bind(this))
    this.socket.on('reconnect', function () {
      //refresh state
      this.componentDidMount()
    }.bind(this))
  }

  componentDidMount () {
    fetch('/api/cloudinfo').then(response => response.json()).then(state => { this.setState(state); this.loadDone() })
  }

  changeHandler = event => {
    // form change handler
    const name = event.target.name
    const value = event.target.value

    this.setState({
      [name]: value
    })
  }

  toggleSyncDelete = event => {
    this.setState({ syncDeletions: event.target.checked });
  }

  handleDoBinUploadSubmit = event => {
    //user clicked enable/disable bin file upload
    fetch('/api/binlogupload', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            binUploadLink: this.state.binUploadLink,
            doBinUpload: !this.state.doBinUpload,
            syncDeletions: this.state.syncDeletions,
        })
      }).then(response => response.json()).then(state => { this.setState(state) });
  }

  renderTitle () {
    return '云端上传'
  }

  renderContent () {
    return (
            <div>
              <p><i>自动将“飞行日志”页面中的binlog上传到远程(网络)目标通过ssh连接</i></p>
                <h3>Bin日志上传</h3>
                <p>所有Bin日志(在Flight Logs-Bin Logs中)将使用rsync同步到以下远程目标。</p>
                <p>同步每20秒运行一次。</p>
                <p>目的地格式为<code>username@server:/path/to/remote/dir</code>, where <code>username</code>在远程服务器上有一个ssh公钥。</p>
                <Form style={{ width: 700 }}>
                    <div className="form-group row" style={{ marginBottom: '5px' }}>
                        <label className="col-sm-3 col-form-label">Rsync目的地</label>
                        <div className="col-sm-7">
                            <input type="text" className="form-control" name="binUploadLink" disabled={this.state.doBinUpload === true ? true : false} onChange={this.changeHandler} value={this.state.binUploadLink}/>
                        </div>
                    </div>
                    <div className="form-group row" style={{ marginBottom: '5px' }}>
                        <label className="col-sm-3 col-form-label">同步文件删除</label>
                        <div className="col-sm-7">
                        <input name="syncDeletions" type="checkbox" disabled={this.state.doBinUpload === true ? true : false} checked={this.state.syncDeletions} onChange={this.toggleSyncDelete}/>
                        </div>
                    </div>
                    
                    <div className="form-group row" style={{ marginBottom: '5px' }}>
                        <div className="col-sm-10">
                        <Button onClick={this.handleDoBinUploadSubmit} className="btn btn-primary">{this.state.doBinUpload === true ? '禁用' : '启用'}</Button>
                        </div>
                    </div>
                    <p>状态: {this.state.binLogStatus}</p>
                </Form>
                <h3>公钥</h3>
                <p><i>此设备上的所有公钥</i></p>
                <p>必须将以下公钥之一添加到远程服务器的<code>~/.ssh/authorized_keys</code>中</p>
                  <div style={{ fontFamily: "monospace", width: 700, wordWrap: 'break-word' }}>
                  <hr/>
                    {this.state.pubkey.map(item => {
                      return (
                          <div>
                            <p>{ item }</p>
                            <hr/>
                          </div>
                          );
                    })}
                  </div>
            </div>
    )
  }
}

export default CloudConfig
