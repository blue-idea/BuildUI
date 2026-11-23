package config

import "time"

const (
	NativeAppMarker            = ".buildui-runtime"
	NativeAppTemplate          = "react-native"
	NativeAppPackageName       = "buildui-native-app"
	NativeAppEntry             = "App.tsx"
	NativeBuildAllPlatforms    = "all"
	NativeBuildPreviewPlatform = "web"
	NativeMetroWorkers         = "2"
	NativeMetroDiagnosticLimit = 8 * 1024
	NativeBundleTimeout        = 3 * time.Minute
	NativeExpoOfflineEnv       = "EXPO_OFFLINE=1"
	NativeExpoMetroConfigEnv   = "EXPO_OVERRIDE_METRO_CONFIG"
)
