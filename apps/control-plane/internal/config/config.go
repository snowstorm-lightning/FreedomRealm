package config

import "os"

type Config struct {
	Address string
	Mode    string
	Version string
}

func Load() Config {
	return Config{
		Address: envOrDefault("FREEDOMREALM_CONTROL_PLANE_ADDR", "127.0.0.1:8080"),
		Mode:    envOrDefault("FREEDOMREALM_CONTROL_PLANE_MODE", "Local Mode"),
		Version: envOrDefault("FREEDOMREALM_CONTROL_PLANE_VERSION", "0.1.0-skeleton"),
	}
}

func envOrDefault(name string, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
