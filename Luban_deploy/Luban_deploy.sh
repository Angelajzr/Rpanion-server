#!/bin/bash

set -e
set -x

git submodule update --init --recursive
echo "export PATH=$PATH:$HOME/.local/bin" >> ~/.bashrc

./install_Luban_libraries.sh

sudo apt install -y wireless-tools ca-certificates curl gnupg cmake 
sudo apt -y install python3-pil python3-numpy python3-pip git wget
sudo systemctl stop dnsmasq
sudo systemctl disable dnsmasq

#Nodejs install
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

## Configure nmcli to not need sudo
sudo sed -i.bak -e '/^\[main\]/aauth-polkit=false' /etc/NetworkManager/NetworkManager.conf

## Ensure nmcli can manage all network devices
sudo touch /etc/NetworkManager/conf.d/10-globally-managed-devices.conf
echo "[keyfile]" | sudo tee -a /etc/NetworkManager/conf.d/10-globally-managed-devices.conf >/dev/null
echo "unmanaged-devices=*,except:type:wifi,except:type:gsm,except:type:cdma,except:type:wwan,except:type:ethernet,type:vlan" | sudo tee -a /etc/NetworkManager/conf.d/10-globally-managed-devices.conf >/dev/null
sudo service network-manager restart

#OpenCV
sudo apt-get install python3-opencv

## mavlink-router
./build_mavlinkrouter.sh

## and build & run Rpanion
./build_rpanion.sh