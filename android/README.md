# AI Chat Room — Android app

A small native shell (a `WebView` plus a server-address setting) around the web UI.
The Node server still does all the work; the app just needs to reach it.

## Install the APK

1. Download `app-debug.apk` (or `app-release.apk`) from the latest **Android APK**
   run under the repository's *Actions* tab, or build it yourself (below).
2. Copy it to your phone and open it. Allow "install from unknown sources" when asked.

## Connect it to the server

1. On your computer, run `npm start` in the project root. The log prints something like
   `On your phone (same Wi-Fi): http://192.168.1.20:3000`.
2. Make sure the phone is on the same Wi-Fi as the computer.
3. Open the app and enter that address (the `http://` is optional). Tap **Connect**.
4. Tap the address strip at the top of the app at any time to change the server.

If the app says it can't reach the server: check that `npm start` is running, that you
used the computer's LAN IP (not `localhost`), and that no firewall is blocking port 3000.

The server can also be deployed anywhere reachable from the internet (Fly, Railway, a VPS)
and the app pointed at that URL, `https://` included.

## Build it yourself

Requirements: JDK 17+, Android SDK with platform 34 and build-tools 34.0.0
(Android Studio installs these), `ANDROID_HOME` set.

```bash
cd android
./gradlew assembleDebug            # → app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease          # → app/build/outputs/apk/release/app-release.apk (debug-signed)

# Pre-fill your own server address in the connect dialog:
./gradlew assembleDebug -PserverUrl=http://192.168.1.20:3000
```

Or open the `android/` folder in Android Studio and press Run.

## Notes

- `minSdk 26` (Android 8.0+), `targetSdk 34`. No third-party dependencies.
- Cleartext `http://` is allowed so LAN addresses work.
- Transcript exports open in the system browser.
- The release build is signed with the default debug key so CI output is installable.
  Set up a real keystore before publishing anywhere.
