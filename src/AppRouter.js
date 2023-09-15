import React from 'react'
import { Route, Routes, Link } from 'react-router-dom'

import About from './about.js'
import Home from './home.js'
import NetworkConfig from './networkconfig.js'
import VideoPage from './video.js'
import FCConfig from './flightcontroller.js'
import LogBrowser from './logBrowser.js'
import NetworkClients from './networkClients.js'
import NTRIPPage from './ntripcontroller.js'
import AdhocConfig from './adhocwifi.js'
import CloudConfig from './cloud.js'
import VPN from './vpnconfig'

function AppRouter () {
  return (
    <div id="wrapper" className="d-flex">
      <div id="sidebar-wrapper" className="bg-light border-right">
      <div id="sidebarheading" className="sidebar-heading">Rpanion Web UI</div>
        <div id="sidebar-items" className="list-group list-group-flush">
          <Link className='list-group-item list-group-item-action bg-light' to="/">主页</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/flightlogs">飞行记录</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/controller">飞控信息</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/ntrip">NTRIP配置</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/network">网络配置</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/adhoc">Adhoc WiFi 配置</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/apclients">AP 客户端管理</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/video">视频推流</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/cloud">云端上传</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/vpn">VPN配置</Link>
          <Link className='list-group-item list-group-item-action bg-light' to="/about">关于</Link>
        </div>
      </div>

      <div className="page-content-wrapper" style={{ width: '100%' }}>
        <div className="container-fluid">
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/controller" element={<FCConfig />} />
            <Route exact path="/network" element={<NetworkConfig />} />
            <Route exact path="/about" element={<About />} />
            <Route exact path="/video" element={<VideoPage />} />
            <Route exact path="/flightlogs" element={<LogBrowser />} />
            <Route exact path="/apclients" element={<NetworkClients />} />
            <Route exact path="/ntrip" element={<NTRIPPage />} />
            <Route exact path="/adhoc" element={<AdhocConfig />} />
            <Route exact path="/cloud" element={<CloudConfig />} />
            <Route exact path="/vpn" element={<VPN/>} />
            <Route element={NoMatch} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function NoMatch ({ location }) {
  return (
    <div>
      <h3>
        匹配失败，找不到路径： <code>{location.pathname}</code>
      </h3>
    </div>
  )
}

export default AppRouter
