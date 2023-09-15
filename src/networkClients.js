import React from 'react'
import Table from 'react-bootstrap/Table'

import basePage from './basePage.js'

import './css/styles.css'

class NetworkClientsPage extends basePage {
  constructor (props) {
    super(props)
    this.state = {
      errors: '',
      loading: true,
      error: null,
      infoMessage: null,
      apname: '',
      apclients: null
    }
  }

  componentDidMount () {
    fetch('/api/networkclients').then(response => response.json()).then(state => { this.setState(state); this.loadDone() })
  }

  renderTitle () {
    return 'AP 客户端管理'
  }

  // create a html table from a list of udpoutputs
  renderClientTableData (clientlist) {
    if (clientlist === null) {
      return <tr></tr>
    }
    return clientlist.map((output, index) => {
      return (
        <tr key={index}>
          <td>{output.hostname}</td>
          <td>{output.ip}</td>
        </tr>
      )
    })
  }

  renderContent () {
    return (
      <div>
        <div style={{ display: (this.state.apname !== '') ? 'block' : 'none' }}>
          <p>以下表格显示连接到接入点的所有DHCP客户端: {this.state.apname}</p>
          <Table id='apclients' striped bordered hover size="sm">
            <thead>
              <tr><th>名称</th><th>IP</th></tr>
              {this.renderClientTableData(this.state.apclients)}
            </thead>
            <tbody>
            </tbody>
          </Table>
        </div>
        <div style={{ display: (this.state.apname === '') ? 'block' : 'none' }}>
          <p>此计算机上没有运行无线热点</p>
        </div>
      </div>
    )
  }
}

export default NetworkClientsPage
