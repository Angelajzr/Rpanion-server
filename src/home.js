import React from 'react'

import basePage from './basePage.js'

class Home extends basePage {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      error: null,
      infoMessage: null
    }
  }

  componentDidMount () {
    this.loadDone()
  }

  renderTitle () {
    return '主页'
  }

  renderContent () {
    return (
      <div>
        <p>欢迎来到 Rpanion-server 主页</p>
        <p>使用左边的链接来配置系统</p>
        <p><a href='https://github.com/stephendade/Rpanion-server'>Rpanion-server website</a></p>
        <p><a href='https://www.docs.rpanion.com/software/rpanion-server'>Rpanion-server documentation</a></p>
      </div>
    )
  }
}

export default Home
