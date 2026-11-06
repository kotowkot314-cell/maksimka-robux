[app]
title = HIxRINUX
package.name = hixrinux
package.domain = org.rocketway
source.dir = .
source.include_exts = py,png,jpg,kv,atlas,wav
version = 0.1
requirements = python3,kivy,ffpyplayer,pillow,requests,pyjnius
orientation = portrait
fullscreen = 0
android.permissions = INTERNET, QUERY_ALL_PACKAGES

[buildozer]
log_level = 2
warn_on_root = 1