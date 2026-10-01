#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " SILENT WITNESS: Headless Android SDK & Build Setup"
echo "=========================================================="

# 1. Detect & Install OpenJDK 17
if ! command -v java >/dev/null 2>&1 || ! java -version 2>&1 | grep -q "17"; then
    echo "[1/6] Installing OpenJDK 17..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y openjdk-17-jdk wget unzip curl
        export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y java-17-openjdk-devel wget unzip curl
        export JAVA_HOME="/usr/lib/jvm/java-17-openjdk"
    fi
else
    echo "[1/6] OpenJDK 17 already detected."
    if [ -z "$JAVA_HOME" ]; then
        export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which javac))))
    fi
fi

# 2. Setup Android SDK Directory
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
mkdir -p "$ANDROID_HOME/cmdline-tools"

# 3. Download Android Command-Line Tools if not present
if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo "[2/6] Downloading Android Command-Line Tools (cmdline-tools;latest)..."
    CMDLINE_ZIP="/tmp/cmdline-tools.zip"
    wget -q --show-progress -O "$CMDLINE_ZIP" "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    mkdir -p /tmp/cmdline-tools-extracted
    unzip -q -o "$CMDLINE_ZIP" -d /tmp/cmdline-tools-extracted
    mv /tmp/cmdline-tools-extracted/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
    rm -f "$CMDLINE_ZIP"
    rm -rf /tmp/cmdline-tools-extracted
else
    echo "[2/6] Android command-line tools already installed."
fi

# 4. Configure PATH
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin:$PATH"

# 5. Accept all Android SDK licenses
echo "[3/6] Accepting Android SDK licenses..."
yes | sdkmanager --licenses >/dev/null 2>&1 || true

# 6. Install Android Platform 34 and Build Tools 34.0.0
echo "[4/6] Installing platforms;android-34 and build-tools;34.0.0..."
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"

# 7. Persist environment variables
echo "[5/6] Writing environment variables to ~/.silent_witness_android_env..."
ENV_FILE="$HOME/.silent_witness_android_env"
cat <<EOF > "$ENV_FILE"
export JAVA_HOME="$JAVA_HOME"
export ANDROID_HOME="$ANDROID_HOME"
export PATH="\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$JAVA_HOME/bin:\$PATH"
EOF

# 8. Test Gradle build
echo "[6/6] Verifying Android Gradle Wrapper..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../android"
chmod +x ./gradlew

echo "=========================================================="
echo " Headless Android Setup Complete!"
echo " Source environment: source $HOME/.silent_witness_android_env"
echo " Build Debug APK:    cd android && ./gradlew assembleDebug"
echo "=========================================================="
