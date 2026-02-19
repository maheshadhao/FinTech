package com.fintech.backend.controller;

import com.fintech.backend.dto.ChatRequest;
import com.fintech.backend.dto.ChatResponse;
import com.fintech.backend.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AIController {

    private final ChatService chatService;

    public AIController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request, Authentication authentication) {
        System.out.println("DEBUG >>> AI chat request received: " + request.getMessage());

        Map<String, Object> chatResult = chatService.processChat(request.getMessage(), authentication);

        ChatResponse response = new ChatResponse();
        response.setResponse((String) chatResult.get("response"));
        response.setIntent((String) chatResult.get("intent"));
        @SuppressWarnings("unchecked")
        Map<String, Object> actionParams = (Map<String, Object>) chatResult.get("actionParameters");
        response.setActionParameters(actionParams);

        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = (Map<String, Object>) chatResult.get("metadata");
        response.setMetadata(metadata);

        return ResponseEntity.ok(response);
    }
}
