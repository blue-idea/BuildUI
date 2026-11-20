package errs

import (
	"fmt"
)

// ErrorKind 领域错误类型
type ErrorKind string

const (
	KindValidation   ErrorKind = "Validation"
	KindNotFound     ErrorKind = "NotFound"
	KindPrecondition ErrorKind = "Precondition"
	KindExternal     ErrorKind = "External"
	KindInternal     ErrorKind = "Internal"
)

// BlotError 结构化错误类型，严禁使用裸字符串报错
type BlotError struct {
	Kind    ErrorKind `json:"kind"`
	Message string    `json:"message"`
	Cause   error     `json:"-"`
}

func (e *BlotError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Kind, e.Message)
}

func (e *BlotError) Unwrap() error {
	return e.Cause
}

// NewValidationError 创建入参校验错误
func NewValidationError(message string, cause error) *BlotError {
	return &BlotError{Kind: KindValidation, Message: message, Cause: cause}
}

// NewNotFoundError 创建未找到资源错误
func NewNotFoundError(message string, cause error) *BlotError {
	return &BlotError{Kind: KindNotFound, Message: message, Cause: cause}
}

// NewPreconditionError 创建前置条件不满足错误
func NewPreconditionError(message string, cause error) *BlotError {
	return &BlotError{Kind: KindPrecondition, Message: message, Cause: cause}
}

// NewExternalError 创建外部依赖调用错误
func NewExternalError(message string, cause error) *BlotError {
	return &BlotError{Kind: KindExternal, Message: message, Cause: cause}
}

// NewInternalError 创建系统内部故障错误
func NewInternalError(message string, cause error) *BlotError {
	return &BlotError{Kind: KindInternal, Message: message, Cause: cause}
}
