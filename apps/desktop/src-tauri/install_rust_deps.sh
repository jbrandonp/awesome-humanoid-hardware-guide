#!/bin/bash
set -e

echo "Updating package lists..."
sudo apt-get update

echo "Installing Rust system dependencies for Tauri..."
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libudev-dev \
  libglib2.0-dev

echo "Dependencies installed successfully!"
