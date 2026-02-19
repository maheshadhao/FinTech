package com.fintech.backend.dto;

import java.util.Map;

public class ChatResponse {
    private String response;
    private String intent;
    private Map<String, Object> actionParameters;
    private Map<String, Object> metadata;

    public ChatResponse() {
    }

    public ChatResponse(String response, String intent, Map<String, Object> actionParameters,
            Map<String, Object> metadata) {
        this.response = response;
        this.intent = intent;
        this.actionParameters = actionParameters;
        this.metadata = metadata;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public Map<String, Object> getActionParameters() {
        return actionParameters;
    }

    public void setActionParameters(Map<String, Object> actionParameters) {
        this.actionParameters = actionParameters;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
