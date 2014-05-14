#export AP_PORT=52219
#export AP_HOST=10.176.114.222
#python -c 'import android; android.Android().webViewShow("file:///sdcard/sl4a/scripts/{gui}.html")'
./adb push {gui}.html /sdcard/sl4a/scripts/oci/{gui}.html
./adb push core.js /sdcard/sl4a/scripts/oci/core.js
./adb push cell.js /sdcard/sl4a/scripts/oci/cell.js
./adb push harvester.js /sdcard/sl4a/scripts/oci/harvester.js
./adb push oci.js /sdcard/sl4a/scripts/oci/oci.js
./adb push measure_info.js /sdcard/sl4a/scripts/oci/measure_info.js
./adb shell am start -a com.googlecode.android_scripting.action.LAUNCH_BACKGROUND_SCRIPT -n com.googlecode.android_scripting/.activity.ScriptingLayerServiceLauncher -e com.googlecode.android_scripting.extra.SCRIPT_PATH /sdcard/sl4a/scripts/oci/{gui}.html

#./adb pull /sdcard/sl4a/scripts/oci/{gui}.html
#./adb pull /sdcard/sl4a/scripts/oci/core.js
#./adb pull /sdcard/sl4a/scripts/oci/cell.js
#./adb pull /sdcard/sl4a/scripts/oci/harvester.js
#./adb pull /sdcard/sl4a/scripts/oci/oci.js
#./adb pull /sdcard/sl4a/scripts/oci/measure_info.js
