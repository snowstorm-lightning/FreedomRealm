package app

import (
	"context"
	"errors"
	"net/http"
	"time"

	"freedomrealm/apps/control-plane/internal/config"
	controlhttp "freedomrealm/apps/control-plane/internal/http"
)

func NewHandler(cfg config.Config) http.Handler {
	return controlhttp.NewServer(cfg).Handler()
}

func Run(ctx context.Context, cfg config.Config) error {
	server := &http.Server{
		Addr:              cfg.Address,
		Handler:           NewHandler(cfg),
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return err
		}
		err := <-errCh
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
