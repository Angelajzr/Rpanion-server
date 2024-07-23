#!/bin/bash

set -e
set -x

## General Packages
sudo apt update
sudo apt upgrade -y
sudo apt install -y libunwind-dev
sudo apt install -y libgstrtspserver-1.0-dev
sudo apt install -y network-manager python3 python3-dev python3-gst-1.0 python3-pip dnsmasq git ninja-build

## Pymavlink
sudo apt install -y libxml2-dev libxslt1-dev python3-lxml python3-numpy
sudo apt purge -y modemmanager
sudo apt remove -y nodejs nodejs-doc

## Ensure the ~/.local/bin is on the system path
echo "PATH=\$PATH:~/.local/bin" >> ~/.profile
source ~/.profile

#pip3 Packages
sudo python3 -m pip install --upgrade pip
sudo pip3 install meson
sudo pip3 install dronekit
sudo pip3 install netifaces --user

## Pymavlink and gpsbabel to create KMZ.
DISABLE_MAVNATIVE=True pip3 install --upgrade pymavlink --user
sudo apt-get install -y gpsbabel zip