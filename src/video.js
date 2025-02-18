import React from 'react';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';

import basePage from './basePage.js';

import './css/styles.css';

class VideoPage extends basePage {
  constructor(props) {
    super(props);
    this.state = {
      errors: "",
      dev: [],
      vidDeviceSelected: this.props.vidDeviceSelected,
      vidres: [],
      vidResSelected: this.props.vidResSelected,
      streamingStatus: this.props.streamingStatus,
      streamAddresses: [],
      rotations: [{ label: "0°", value: 0 }, { label: "90°", value: 90 }, { label: "180°", value: 180 }, { label: "270°", value: 270 }],
      rotSelected: { label: "0°", value: 0 },
      bitrate: 1000,
      UDPChecked: false,
      useUDPIP: "127.0.0.1",
      useUDPPort: 5600,
      FPSMax: 0,
      fps: [],
      fpsSelected: 1,
      loading: true,
      error: null,
      infoMessage: null,
      timestamp: false
    }
  }

  componentDidMount() {
    fetch(`/api/videodevices`).then(response => response.json()).then(state => { this.setState(state); this.loadDone(); this.handleVideoChange(state.vidDeviceSelected, "") });
  }

  handleVideoChange = (value, action) => {
    //new video device
    this.setState({ vidDeviceSelected: value, vidres: value.caps });
    this.handleResChange(this.state.streamingStatus !== true ? value.caps[0] : this.state.vidResSelected, "");
  }

  handleResChange = (value, action) => {
    //resolution box new selected value
    if (value.fpsmax !== 0) {
      this.setState({ vidResSelected: value, FPSMax: value.fpsmax, fpsSelected: Math.min(value.fpsmax, 10), fps: value.fps });
    }
    else {
      this.setState({ vidResSelected: value, FPSMax: value.fpsmax, fpsSelected: value.fps[0], fps: value.fps });
    }
  }

  handleRotChange = (value, action) => {
    //resolution box new selected value
    this.setState({ rotSelected: value });
  }

  handleBitrateChange = (event) => {
    //bitrate spinner new value
    this.setState({ bitrate: event.target.value });
  }

  handleUseUDPChange = (event) => {
    //bitrate spinner new value
    this.setState({ UDPChecked: event.target.value==="rtp" });
  }

  handleUDPIPChange = (event) => {
    //bitrate spinner new value
    this.setState({ useUDPIP: event.target.value });
  }

  handleUDPPortChange = (event) => {
    //bitrate spinner new value
    this.setState({ useUDPPort: event.target.value });
  }

  handleFPSChange = (event) => {
    //bitrate spinner new value
    this.setState({ fpsSelected: event.target.value });
  }

  handleFPSChangeSelect = (value, action) => {
    //resolution box new selected value
    this.setState({ fpsSelected: value });
  }

  handleTimestampChange = (event) => {
    //use timestamp new value
    this.setState({ timestamp: !this.state.timestamp });
  }

  handleStreaming = (event) => {
    //user clicked start/stop streaming
    this.setState({ waiting: true }, () => {
      fetch('/api/startstopvideo', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !this.state.streamingStatus,
          device: this.state.vidDeviceSelected.value,
          height: this.state.vidResSelected.height,
          width: this.state.vidResSelected.width,
          format: this.state.vidResSelected.format,
          rotation: this.state.rotSelected.value,
          fps: this.state.FPSMax !== 0 ? this.state.fpsSelected : Number(this.state.fpsSelected.value),
          //fps: this.state.fpsSelected,
          bitrate: this.state.bitrate,
          useUDP: this.state.UDPChecked,
          useUDPIP: this.state.useUDPIP,
          useUDPPort: this.state.useUDPPort,
          useTimestamp: this.state.timestamp,
        })
      }).then(response => response.json()).then(state => { this.setState(state); this.setState({ waiting: false }) });
    });
  }

  renderTitle() {
    return "视频推流";
  }

  renderContent() {
    return (
      <Form style={{ width: 600 }}>
        <p><i>从任意连接的摄像头设备实时传输视频。每次只能传输1台摄像机。</i></p>
        <h2>配置</h2>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
              <label className="col-sm-4 col-form-label">推流模式</label>
              <div className="col-sm-8">
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="streamtype" value="rtp" disabled={this.state.streamingStatus} onChange={this.handleUseUDPChange} checked={this.state.UDPChecked} />
                  <label className="form-check-label">RTP (向单个客户端传输)</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="streamtype" value="rtsp" disabled={this.state.streamingStatus} onChange={this.handleUseUDPChange} checked={!this.state.UDPChecked} />
                  <label className="form-check-label">RTSP (可以连接多个客户端)</label>
                </div>
              </div>
            </div>

        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">设备</label>
          <div className="col-sm-8">
            <Select isDisabled={this.state.streamingStatus} onChange={this.handleVideoChange} options={this.state.dev} value={this.state.vidDeviceSelected} />
          </div>
        </div>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">分辨率</label>
          <div className="col-sm-8">
            <Select isDisabled={this.state.streamingStatus} options={this.state.vidres} onChange={this.handleResChange} value={this.state.vidResSelected} />
          </div>
        </div>
        <div style={{ display: (typeof this.state.vidResSelected !== 'undefined' && this.state.vidResSelected.format !== "video/x-h264") ? "block" : "none" }}>
          <div className="form-group row" style={{ marginBottom: '5px' }}>
            <label className="col-sm-4 col-form-label">旋转</label>
            <div className="col-sm-8">
              <Select isDisabled={this.state.streamingStatus} options={this.state.rotations} onChange={this.handleRotChange} value={this.state.rotSelected} />
            </div>
          </div>
          <div className="form-group row" style={{ marginBottom: '5px' }}>
            <label className="col-sm-4 col-form-label">最大比特率</label>
            <div className="col-sm-8">
              <input disabled={this.state.streamingStatus} type="number" name="bitrate" min="50" max="10000" step="10" onChange={this.handleBitrateChange} value={this.state.bitrate} />kbps
            </div>
          </div>
          <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">时间戳叠加</label>
          <div className="col-sm-8">
            <input type="checkbox" disabled={this.state.streamingStatus} onChange={this.handleTimestampChange} checked={this.state.timestamp} />
          </div>
          </div>
        </div>
        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <label className="col-sm-4 col-form-label">帧率</label>
          <div className="col-sm-8" style={{ display: (this.state.FPSMax === 0) ? "block" : "none" }}>
            <Select isDisabled={this.state.streamingStatus} options={this.state.fps} value={this.state.fpsSelected} onChange={this.handleFPSChangeSelect} />
          </div>
          <div className="col-sm-8" style={{ display: (this.state.FPSMax !== 0) ? "block" : "none" }}>
            <input disabled={this.state.streamingStatus} type="number" name="fps" min="1" max={this.state.FPSMax} step="1" onChange={this.handleFPSChange} value={this.state.fpsSelected} />fps (max: {this.state.FPSMax})
          </div>
        </div>
        <div style={{ display: (this.state.UDPChecked) ? "block" : "none" }}>
          <div className="form-group row" style={{ marginBottom: '5px' }}>
            <label className="col-sm-4 col-form-label ">目标 IP</label>
            <div className="col-sm-8">
              <input type="text" name="ipaddress" disabled={!this.state.UDPChecked || this.state.streamingStatus} value={this.state.useUDPIP} onChange={this.handleUDPIPChange} />
            </div>
          </div>
          <div className="form-group row" style={{ marginBottom: '5px' }}>
            <label className="col-sm-4 col-form-label">目标端口</label>
            <div className="col-sm-8">
              <input type="text" name="port" disabled={!this.state.UDPChecked || this.state.streamingStatus} value={this.state.useUDPPort} onChange={this.handleUDPPortChange} />
            </div>
          </div>
        </div>

        <div className="form-group row" style={{ marginBottom: '5px' }}>
          <div className="col-sm-8">
            <Button onClick={this.handleStreaming} className="btn btn-primary">{this.state.streamingStatus ? "停止串流" : "开始串流"}</Button>
          </div>
        </div>

        <br />
        <h3 style={{ display: (this.state.streamingStatus) ? "block" : "none" }}>串流地址</h3>
        <Accordion defaultActiveKey="0" style={{ display: (this.state.streamingStatus && !this.state.UDPChecked) ? "block" : "none" }}>
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              + RTSP 串流地址 (for VLC, etc)
            </Accordion.Header>
            <Accordion.Body>
              {this.state.streamAddresses.map((item, index) => (
                <p style={{ fontFamily: "monospace" }}>{item}</p>
              ))}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              + GStreamer 
            </Accordion.Header>
            <Accordion.Body>
              {this.state.streamAddresses.map((item, index) => (
                <p style={{ fontFamily: "monospace" }}>gst-launch-1.0 rtspsrc location={item} latency=0 is-live=True ! queue ! decodebin ! autovideosink</p>
              ))}
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              + Mission Planner 
            </Accordion.Header>
            <Accordion.Body>
              {this.state.streamAddresses.map((item, index) => (
                <p style={{ fontFamily: "monospace" }}>rtspsrc location={item} latency=0 is-live=True ! queue ! application/x-rtp ! rtph264depay ! avdec_h264 ! videoconvert ! video/x-raw,format=BGRA ! appsink name=outsink</p>
              ))}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        <Accordion defaultActiveKey="0" style={{ display: (this.state.streamingStatus && this.state.UDPChecked) ? "block" : "none" }}>
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              + QGroundControl
            </Accordion.Header>
            <Accordion.Body>
              <p style={{ fontFamily: "monospace" }}>Video Source: UDP h.264 Video Stream</p>
              <p style={{ fontFamily: "monospace" }}>Port: {this.state.useUDPPort}</p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              + GStreamer
            </Accordion.Header>
            <Accordion.Body>
              <p style={{ fontFamily: "monospace" }}>gst-launch-1.0 udpsrc port={this.state.useUDPPort} caps='application/x-rtp, media=(string)video, clock-rate=(int)90000, encoding-name=(string)H264' ! rtpjitterbuffer ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! autovideosink sync=false</p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              + Mission Planner
            </Accordion.Header>
            <Accordion.Body>
              <p style={{ fontFamily: "monospace" }}>udpsrc port={this.state.useUDPPort} buffer-size=90000 ! application/x-rtp ! rtpjitterbuffer ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! video/x-raw,format=BGRA ! appsink name=outsink sync=false</p>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Form>
    );
  }
}


export default VideoPage;
