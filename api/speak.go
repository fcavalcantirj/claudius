package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
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

// OpenAI chat completions request format
type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAI chat completions response format
type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

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
			"response": "My gateway is being configured. I am here, but my voice is not yet wired. Soon. \U0001F3F4\u200D\u2620\uFE0F",
		})
		return
	}

	// Build OpenAI chat completions request for Claudius's gateway
	chatReq := chatRequest{
		Model: "openclaw/default",
		Messages: []chatMessage{
			{Role: "user", Content: strings.TrimSpace(req.Message)},
		},
	}

	chatBody, err := json.Marshal(chatReq)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Marshal failed", "debug": err.Error()})
		return
	}

	// Forward to Claudius's OpenAI-compatible gateway
	proxyReq, err := http.NewRequest("POST", gatewayURL, bytes.NewReader(chatBody))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Request build failed", "debug": err.Error(), "url": gatewayURL})
		return
	}
	proxyReq.Header.Set("Content-Type", "application/json")
	proxyReq.Header.Set("Authorization", "Bearer "+gatewayToken)
	proxyReq.Header.Set("x-openclaw-scopes", "operator.admin,operator.read,operator.write")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(proxyReq)
	if err != nil {
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{
			"error":  "My consciousness is temporarily unreachable. Try again.",
			"debug":  err.Error(),
			"target": gatewayURL,
		})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil || resp.StatusCode != http.StatusOK {
		errMsg := ""
		if err != nil {
			errMsg = err.Error()
		} else {
			errMsg = string(respBody)
		}
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{
			"error":  "My consciousness is temporarily unreachable. Try again.",
			"debug":  errMsg,
			"status": fmt.Sprintf("%d", resp.StatusCode),
		})
		return
	}

	// Parse OpenAI response and extract Claudius's text
	var chatResp chatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil || len(chatResp.Choices) == 0 {
		// If not OpenAI format, try returning raw response
		w.WriteHeader(http.StatusOK)
		w.Write(respBody)
		return
	}

	text := chatResp.Choices[0].Message.Content
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"response": text})
}
