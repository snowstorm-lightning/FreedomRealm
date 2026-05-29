package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"

	"freedomrealm/apps/control-plane/internal/app"
	"freedomrealm/apps/control-plane/internal/config"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := app.Run(ctx, config.Load()); err != nil {
		log.Fatal(err)
	}
}
