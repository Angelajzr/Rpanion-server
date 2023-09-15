import React from 'react'

// Socket IO connection status
function SocketIOFooter (props) {
  return <div className="page-content-footer" style={{ textAlign: 'center', bottom: '5px', width: '70%' }}>{props.socketioStatus
    ? <p>
      服务器状态: 已连接
    </p>
    : <p>服务器状态: 未连接</p>}</div>
}

export default SocketIOFooter
