package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"buildui/internal/config"
	"buildui/internal/llm"
	"buildui/internal/plugins"
)

func (s *ChatService) resolvePluginAutomation(ctx context.Context, appID int64, selection *plugins.ProjectAutomation) (*plugins.ProjectAutomation, error) {
	if s.plugins == nil {
		return nil, nil
	}
	if selection != nil {
		return selection, s.plugins.SaveProjectAutomation(ctx, appID, *selection)
	}
	return s.plugins.ProjectAutomation(ctx, appID)
}

func (s *ChatService) attachPluginTools(ctx context.Context, appID, chatID int64, directory string, automation *plugins.ProjectAutomation, request *llm.ChatRequest) func() {
	if s.plugins == nil || (automation != nil && (!automation.Enabled || len(automation.PluginIDs) == 0)) {
		return func() {}
	}
	var selectedIDs []int64
	if automation != nil {
		selectedIDs = automation.PluginIDs
	}
	turn := s.plugins.StartTurn(ctx, appID, directory)
	capabilities := turn.Capabilities(ctx, selectedIDs...)
	if len(capabilities) == 0 {
		return turn.Close
	}
	request.ToolInstructions = config.MCPExternalDataPrompt
	available := make(map[string]plugins.Capability, len(capabilities))
	var pluginNames []string
	for index, item := range capabilities {
		if index == 0 || item.PluginID != capabilities[index-1].PluginID {
			pluginNames = append(pluginNames, item.PluginName)
		}
		// 编号避免同名的 MCP 工具覆盖，也保证名称符合模型网关的约束。
		name := fmt.Sprintf("mcp_%d_%d", item.PluginID, index+1)
		available[name] = item
		request.Tools = append(request.Tools, llm.ToolDefinition{Name: name, Description: item.PluginName + " / " + item.Name + ": " + item.Description, Parameters: item.Schema})
	}
	if automation != nil {
		names, _ := json.Marshal(pluginNames)
		request.ToolInstructions += "\n" + fmt.Sprintf(config.MCPSelectedToolsPrompt, names)
	}
	request.OnToolCall = func(ctx context.Context, call llm.ToolCall) (string, error) {
		item, exists := available[call.Function.Name]
		if !exists {
			return "", errors.New("This MCP tool is not available for the project.")
		}
		s.emitProgress(chatID, "Using plugin tool: "+item.Name)
		return turn.Call(ctx, item.PluginID, item.Name, json.RawMessage(call.Function.Arguments))
	}
	return turn.Close
}
