<div align="left">
用户文档位于 https://www.docs.rpanion.com/software/rpanion-server

<p float="left">
<img src="https://raw.githubusercontent.com/stephendade/Rpanion-server/master/images/controller.png" width="200">
<img src="https://raw.githubusercontent.com/stephendade/Rpanion-server/master/images/network.png" width="200">
<img src="https://raw.githubusercontent.com/stephendade/Rpanion-server/master/images/video.png" width="200">
</p>

# Rpanion-server


这是一个基于node.js的服务器，用于Mavlink-based载具中的机载电脑（例如Ardupilot、PX4）。

它提供了一个基于web的界面（运行在机载电脑上），可以从中配置系统设置，如网络、遥测和视频流。

在树莓派上，Rpanion-server与Raspberry Pi OS和Ubuntu 20.04 LTS兼容。

在鲁班猫上，Rpanion-server与Ubuntu 22.04 LTS兼容。

在Nvidia Jetson上，Rpanion-server与Ubuntu 18.04 LTS兼容。

在[Libre Computer Le Potato](https://libre.computer/products/aml-s905x-cc/)上，Rpanion-server与他们的[Raspberry Pi OS](https://distro.libre.computer/ci/raspbian/)兼容。

## Features

- Rpanion-server允许用户配置：
  - 飞行控制器遥测路由到UDP输出
  - 通过RTSP服务器进行视频流传输
  - 网络配置
  - NTRIP流
  - 日志记录（tlog和bin日志）

## Dependencies and First-time configuration

以下说明假设您已将Rpanion-server存储库克隆到`~/`。如果没有，请使用：

```
cd ~/ && git clone --recursive https://github.com/stephendade/Rpanion-server.git
```

### Automatic (鲁班猫0W)

对于鲁班猫0W，请在全新的操作系统安装上运行以下命令以配置和安装Rpanion-server及其所有必需的依赖项。请注意，这不会配置初始的WiFi热点。

```
cd ./Luban_deploy && ./install_Luban_libraries.sh && ./Luban_deploy.sh
```

### Automatic (Raspberry Pi)

对于树莓派2、3、4和Zero(2)，在全新的Raspberry Pi OS安装上运行以下命令以配置和安装带有所有必需依赖项的Rpanion-server。请注意，这不会配置初始的WiFi热点。

```
cd ./deploy && ./RasPi2-3-4-deploy.sh
```

如果在树莓派上运行Ubuntu 20.04操作系统，请使用：

```
cd ~/Rpanion-server/deploy/ && ./RasPi-ubuntu20-deploy.sh
```

如果在树莓派上运行Ubuntu 22.04操作系统，请使用：

```
cd ~/Rpanion-server/deploy/ && ./RasPi-ubuntu22-deploy.sh
```

请注意，由于与树莓派不兼容，CSI摄像头目前在Ubuntu 22.04上无法使用。

对于树莓派Zero W(1)，在全新的Raspberry Pi OS安装上运行以下命令以配置和安装Rpanion-server。请注意，这会配置初始的WiFi热点。

```
cd ./deploy && ./RasPiZero-deploy.sh
```

如果尚未为初始WiFi热点进行配置，请运行`./deploy/wifi_access_point.sh`脚本。

热点的SSID为"rpanion"，密码为"rpanion123"。

树莓派的IP地址将是10.0.2.100，因此Rpanion-sever网站将在[http://10.0.2.100:3000 ](http://10.0.2.100:3000/)上可用。

### Manual (Raspberry Pi OS)

Rpanion-server需要安装一个较新版本的node.js。可以通过包管理器进行安装：

```
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

请注意，树莓派Zero (1)需要一个非官方构建的nodejs版本，

因为Rpanion-server需要nodejs版本12或更高，并且官方支持的Pi Zero版本截至nodejs版本11。

```
wget https://unofficial-builds.nodejs.org/download/release/v16.19.1/node-v16.19.1-linux-armv6l.tar.xz
sudo mkdir -p /usr/local/lib/nodejs
sudo tar -xJvf node-v16.19.1-linux-armv6l.tar.xz -C /usr/local/lib/nodejs
sudo ln -s /usr/local/lib/nodejs/node-v16.19.1-linux-armv6l/bin/node /usr/local/bin
sudo ln -s /usr/local/lib/nodejs/node-v16.19.1-linux-armv6l/bin/npm /usr/local/bin
```

可以通过以下方式安装所需的先决条件包：

```
sudo apt install libgstreamer-plugins-base1.0* libgstreamer1.0-dev gstreamer1.0-plugins-ugly libgstrtspserver-1.0-dev gstreamer1.0-plugins-base-apps network-manager python3 python3-dev python3-gst-1.0 python3-pip dnsmasq ninja-build

sudo pip3 install meson
pip3 install netifaces --user
```

对于某些系统（如树莓派），可能需要从默认用户运行`nmcli`时附加额外的权限。

在`/etc/NetworkManager/NetworkManager.conf`中在`main`部分中添加`auth-polkit=false`。

如果使用较旧版本的树莓派操作系统（Buster，V10或更低版本），必须安装`gst-rpicamsrc` 。

请参阅 https://github.com/thaytan/gst-rpicamsrc 获取安装说明。

要（可选地）使用Zerotier和/或Wireguard VPN，按照以下方式安装：

```
curl -s https://install.zerotier.com | sudo bash
sudo apt install wireguard wireguard-tools
```

用于后端转发的mavlink-router (https://github.com/intel/mavlink-router) 软件需要被安装：

```
git submodule init && git submodule update
cd ./modules/mavlink-router
meson setup build . --buildtype=release
ninja -C build
sudo ninja -C build install
```

在Rpanion-server文件夹中需要使用`npm install`安装node.js包。

### Automatic (Nvidia Jetson)

对于Nvidia Jetson，请在全新的操作系统安装上运行以下命令以配置和安装Rpanion-server及其所有必需的依赖项。请注意，这不会配置初始的WiFi热点。

```
cd ./deploy && ./jetson-deploy.sh
```

### Automatic (Libre Computer AML-S905X-CC aka 'Le Potato')

对于Le Potato，请在全新的操作系统安装上运行以下命令以配置和安装Rpanion-server及其所有必需的依赖项。请注意，这不会配置初始的WiFi热点。

```
cd ./deploy && ./RasPi2-3-4-deploy.sh
```

如果使用USB转串口转换器，您可能需要修改设备的权限。

**临时设备权限更新**

```
sudo chmod 666 /dev/ttyACM0
```

**持久设备权限更新**

请按照此网站上针对您特定设备的步骤进行操作： https://www.xmodulo.com/change-usb-device-permission-linux.html

### Automatic (x86 boards and laptops)

对于任何基于x86的模块或笔记本电脑，请运行以下脚本配置并安装Rpanion-server及其所有必需的依赖项。请注意，这不会配置初始的WiFi热点。

```
cd ./deploy && ./x86-ubuntu20-deploy.sh
```

### Updating


从Github更新Rpanion-server时，请运行`npm install`以获取任何更改的依赖项。

如果以生产模式运行，请运行`npm run build`重新构建ReactJS应用程序。

如果将Rpanion-server作为服务运行，请确保重新启动服务。

可以通过以下方式执行自动更新脚本：

```
./deploy/upgrade.sh
```

## Building and Running in production mode

在生产模式下运行时，首先构建ReactJS应用程序。这可以提供比在开发模式下运行更好的性能增益。

```bash
npm run build
PORT=3000
npm run server
```

## Building and Running in development mode


在开发模式下运行允许任何代码更改触发Rpanion-server的重新启动。

Rpanion-server包括一个运行在端口3001上的node.js服务器和一个运行在开发模式下端口3000上的React前端应用程序。

在生产模式下，React应用程序会从运行在端口3001上的node.js服务器上静态渲染。可以通过设置`PORT`环境变量来覆盖这个设置（参见`rpanion.service`作为示例）。

你可以单独启动服务器，使用以下命令：

```bash
npm run server
```

单独运行React应用程序，使用以下命令：

```bash
npm start
```

同时运行两个应用程序，使用以下命令：

```bash
npm run dev
```

此时，网站将在`http://<设备IP>:3000`上激活。

## Tests


单元测试被分成前端（ReactJS）和后端的两个独立部分。

可以使用以下命令运行单元测试：

```bash
npm run testback
npm run testfront
```

后端测试会自动计算代码覆盖率统计信息。

通过以下命令可以进行Linting（使用eslint）：

```bash
npm run lint
```

## Releasing


使用`npx npm-check-updates -u`命令来更新Node.js库。

使用`npm version minor`命令创建一个新的发布版本。

要从SD卡制作磁盘镜像，请插入卡并运行`./deploy/create_image.sh`

## Running as a Service

为了让Rpanion-server在启动时自动运行，系统中包含了一个 systemd 服务文件。

可以通过以下方式启用它：

```
sudo cp rpanion.service /etc/systemd/system
sudo systemctl enable rpanion.service
```

