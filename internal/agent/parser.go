package agent

import (
	"path"
	"regexp"
	"strings"

	"buildui/internal/errs"
)

// ToolStartEvent 声明开始调用某项工具
type ToolStartEvent struct {
	Tool string
	Path string
}

// ToolEndEvent 声明工具调用结束
type ToolEndEvent struct {
	Tool    string
	Success bool
	Error   string
}

// WrittenFile 记录落盘文件的元数据
type WrittenFile struct {
	Path        string
	Description string
	Content     string
}

// ParserCallbacks 状态机事件回调
type ParserCallbacks struct {
	OnChunk         func(chunk string)
	OnToolStart     func(event ToolStartEvent)
	OnToolEnd       func(event ToolEndEvent)
	OnWriteFile     func(path, description, content string) error
	OnAddDependency func(packages []string) error
}

type parserState int

const (
	stateText parserState = iota
	stateTagOpen
	stateWriteBody
	stateDepBody
)

var (
	attrPathRegex        = regexp.MustCompile(`path="([^"]+)"`)
	attrDescriptionRegex = regexp.MustCompile(`description="([^"]*)"`)
	attrPackagesRegex    = regexp.MustCompile(`packages="([^"]+)"`)
	codeFence            = regexp.MustCompile("^```[a-zA-Z0-9_+.-]*$")
)

// XMLStreamParser 增量流式 XML 状态机
type XMLStreamParser struct {
	callbacks    ParserCallbacks
	state        parserState
	buffer       strings.Builder
	currPath     string
	currDesc     string
	currPackages []string
}

// NewXMLStreamParser 创建增量流式 XML 解析器
func NewXMLStreamParser(cb ParserCallbacks) *XMLStreamParser {
	return &XMLStreamParser{
		callbacks: cb,
		state:     stateText,
	}
}

// Feed 逐 Token 增量输入
func (p *XMLStreamParser) Feed(token string) error {
	for i := 0; i < len(token); i++ {
		char := token[i]

		switch p.state {
		case stateText:
			if char == '<' {
				p.state = stateTagOpen
				p.buffer.Reset()
				p.buffer.WriteByte(char)
			} else {
				// 一次发送标签前的完整文本，避免把 UTF-8 字节当作单独的字符。
				end := strings.IndexByte(token[i:], '<')
				if end == -1 {
					end = len(token) - i
				}
				if p.callbacks.OnChunk != nil {
					p.callbacks.OnChunk(token[i : i+end])
				}
				i += end - 1
			}

		case stateTagOpen:
			p.buffer.WriteByte(char)
			bufStr := p.buffer.String()

			// 检查是否可能不是 dyad 标签，若是普通 html 标签且已闭合
			if char == '>' {
				if strings.HasPrefix(bufStr, "<dyad-write") {
					pathMatch := attrPathRegex.FindStringSubmatch(bufStr)
					descMatch := attrDescriptionRegex.FindStringSubmatch(bufStr)

					p.currPath = ""
					p.currDesc = ""
					if len(pathMatch) > 1 {
						p.currPath = pathMatch[1]
					}
					if len(descMatch) > 1 {
						p.currDesc = descMatch[1]
					}

					p.buffer.Reset()
					p.state = stateWriteBody
					if p.callbacks.OnToolStart != nil {
						p.callbacks.OnToolStart(ToolStartEvent{
							Tool: "write_file",
							Path: p.currPath,
						})
					}
				} else if strings.HasPrefix(bufStr, "<dyad-add-dependency") {
					pkgMatch := attrPackagesRegex.FindStringSubmatch(bufStr)
					p.currPackages = nil
					if len(pkgMatch) > 1 {
						p.currPackages = strings.Fields(pkgMatch[1])
					}

					if p.callbacks.OnToolStart != nil {
						p.callbacks.OnToolStart(ToolStartEvent{
							Tool: "add_dependency",
						})
					}

					// 如果是单标签 <dyad-add-dependency ... /> 直接完成
					if strings.HasSuffix(strings.TrimSpace(bufStr), "/>") {
						p.completeAddDependency()
						p.buffer.Reset()
						p.state = stateText
					} else {
						p.buffer.Reset()
						p.state = stateDepBody
					}
				} else {
					// 并非 dyad 标签，回退为普通文本流
					if p.callbacks.OnChunk != nil {
						p.callbacks.OnChunk(bufStr)
					}
					p.buffer.Reset()
					p.state = stateText
				}
			} else if len(bufStr) > 12 && !strings.HasPrefix("<dyad-write", bufStr[:min(len(bufStr), 11)]) && !strings.HasPrefix("<dyad-add-dep", bufStr[:min(len(bufStr), 13)]) && !strings.HasPrefix("</dyad-", bufStr[:min(len(bufStr), 7)]) {
				// 不匹配任何 dyad 标签前缀，直接当作文本流放出
				if p.callbacks.OnChunk != nil {
					p.callbacks.OnChunk(bufStr)
				}
				p.buffer.Reset()
				p.state = stateText
			}

		case stateWriteBody:
			p.buffer.WriteByte(char)
			bufStr := p.buffer.String()
			closeTag := "</dyad-write>"
			if strings.HasSuffix(bufStr, closeTag) {
				content := bufStr[:len(bufStr)-len(closeTag)]
				// 清除开头可能的换行
				content = unwrapSourceFence(p.currPath, strings.TrimPrefix(content, "\n"))

				var err error
				if p.callbacks.OnWriteFile != nil {
					err = p.callbacks.OnWriteFile(p.currPath, p.currDesc, content)
				}

				if p.callbacks.OnToolEnd != nil {
					p.callbacks.OnToolEnd(ToolEndEvent{
						Tool:    "write_file",
						Success: err == nil,
						Error:   errToString(err),
					})
				}

				p.buffer.Reset()
				p.state = stateText
				if err != nil {
					return err
				}
			}

		case stateDepBody:
			p.buffer.WriteByte(char)
			bufStr := p.buffer.String()
			closeTag := "</dyad-add-dependency>"
			if strings.HasSuffix(bufStr, closeTag) {
				p.completeAddDependency()
				p.buffer.Reset()
				p.state = stateText
			}
		}
	}
	return nil
}

func unwrapSourceFence(filename, content string) string {
	switch strings.ToLower(path.Ext(filename)) {
	case ".md", ".mdx", ".markdown", ".txt":
		return content
	}
	// 仅去掉包住整份文件的围栏，保留文件正文及正文里的代码块。
	first, body, hasFirst := strings.Cut(strings.TrimSpace(content), "\n")
	end := strings.LastIndexByte(body, '\n')
	if hasFirst && codeFence.MatchString(strings.TrimSpace(first)) && end >= 0 && body[end+1:] == "```" {
		return body[:end+1]
	}
	return content
}

func (p *XMLStreamParser) completeAddDependency() {
	var err error
	if p.callbacks.OnAddDependency != nil {
		err = p.callbacks.OnAddDependency(p.currPackages)
	}
	if p.callbacks.OnToolEnd != nil {
		p.callbacks.OnToolEnd(ToolEndEvent{
			Tool:    "add_dependency",
			Success: err == nil,
			Error:   errToString(err),
		})
	}
}

// Flush 结束流式输入并排空剩余缓冲区
func (p *XMLStreamParser) Flush() error {
	switch p.state {
	case stateWriteBody, stateDepBody:
		err := errs.NewExternalError("The model response ended before a tool call was complete. Try again.", nil)
		p.abort(err)
		return err
	case stateTagOpen, stateText:
		if p.buffer.Len() > 0 && p.callbacks.OnChunk != nil {
			p.callbacks.OnChunk(p.buffer.String())
		}
	}
	p.buffer.Reset()
	p.state = stateText
	return nil
}

// abort 关闭已开始的工具调用，保留调用方收到的原始错误。
func (p *XMLStreamParser) abort(err error) {
	if p.callbacks.OnToolEnd != nil {
		switch p.state {
		case stateWriteBody:
			p.callbacks.OnToolEnd(ToolEndEvent{Tool: "write_file", Success: false, Error: err.Error()})
		case stateDepBody:
			p.callbacks.OnToolEnd(ToolEndEvent{Tool: "add_dependency", Success: false, Error: err.Error()})
		}
	}
	p.buffer.Reset()
	p.state = stateText
}

func errToString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
