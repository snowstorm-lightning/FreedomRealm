package platform

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

func DeterministicRef(prefix string, parts ...string) string {
	hash := sha256.Sum256([]byte(strings.Join(parts, "|")))
	return prefix + "-" + hex.EncodeToString(hash[:])[:12]
}
