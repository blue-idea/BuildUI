package config

import "time"

const (
	MCPKeyFile               = "mcp-credentials.key"
	MCPRequestTimeout        = 15 * time.Second
	MCPStdioDiscoveryTimeout = 60 * time.Second
	MCPOAuthTimeout          = 3 * time.Minute
	MCPOAuthPort             = 53682
	MCPToolCallTimeout       = 35 * time.Second
	MCPDiscoveryLimit        = 128
	MCPToolRounds            = 4
	MCPToolResultLimit       = 32 * 1024
)
