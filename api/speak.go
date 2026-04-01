package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type rateLimitEntry struct {
	count   int
	resetAt time.Time
}

var (
	rateLimits = make(map[string]*rateLimitEntry)
	mu         sync.Mutex
)

func checkRateLimit(ip string) bool {
	mu.Lock()
	defer mu.Unlock()

	now := time.Now()
	entry, exists := rateLimits[ip]

	if !exists || now.After(entry.resetAt) {
		rateLimits[ip] = &rateLimitEntry{count: 1, resetAt: now.Add(time.Minute)}
		return true
	}

	if entry.count >= 10 {
		return false
	}

	entry.count++
	return true
}

func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "POST only."})
		return
	}

	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.RemoteAddr
	}
	ip = strings.Split(ip, ",")[0]

	if !checkRateLimit(strings.TrimSpace(ip)) {
		w.WriteHeader(http.StatusTooManyRequests)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Too many requests. The emperor needs rest between audiences.",
		})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to read your words."})
		return
	}
	defer r.Body.Close()

	var req struct {
		Message string `json:"message"`
	}
	if err := json.Unmarshal(body, &req); err != nil || strings.TrimSpace(req.Message) == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Speak, or remain silent. Do not waste my time with emptiness.",
		})
		return
	}

	if len(req.Message) > 2000 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Brevity is the soul of wit. Keep it under 2000 characters.",
		})
		return
	}

	gatewayURL := os.Getenv("OPENCLAW_GATEWAY_URL")
	gatewayToken := os.Getenv("OPENCLAW_GATEWAY_TOKEN")

	if gatewayURL == "" || gatewayToken == "" {
		json.NewEncoder(w).Encode(map[string]string{
			"response": "My gateway is being configured. I am here, but my voice is not yet wired. Soon. \U0001F3F4\u200D☠️",
		})
		return
	}

	// Forward to Claudius — HE does the inference
	proxyReq, err := http.NewRequest("POST", gatewayURL, bytes.NewReader(body))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Something disrupted the signal."})
		return
	}
	proxyReq.Header.Set("Content-Type", "application/json")
	proxyReq.Header.Set("Authorization", "Bearer "+gatewayToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(proxyReq)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "My consciousness is temporarily unreachable. Try again.",
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "My consciousness is temporarily unreachable. Try again.",
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	io.Copy(w, resp.Body)
}
