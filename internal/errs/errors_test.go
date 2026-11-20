package errs_test

import (
	"errors"
	"testing"

	"buildui/internal/errs"
)

// v1.REQ-001: 基础领域错误类型 BlotError 及其分类测试
func TestBlotError_FormattingAndKinds(t *testing.T) {
	cases := []struct {
		name         string
		err          *errs.BlotError
		expectedKind errs.ErrorKind
		expectedStr  string
	}{
		{
			name:         "Validation error formatting",
			err:          errs.NewValidationError("invalid app name", nil),
			expectedKind: errs.KindValidation,
			expectedStr:  "[Validation] invalid app name",
		},
		{
			name:         "NotFound error formatting",
			err:          errs.NewNotFoundError("app not found", nil),
			expectedKind: errs.KindNotFound,
			expectedStr:  "[NotFound] app not found",
		},
		{
			name:         "Precondition error formatting",
			err:          errs.NewPreconditionError("git workspace is dirty", nil),
			expectedKind: errs.KindPrecondition,
			expectedStr:  "[Precondition] git workspace is dirty",
		},
		{
			name:         "External error formatting",
			err:          errs.NewExternalError("llm quota exceeded", nil),
			expectedKind: errs.KindExternal,
			expectedStr:  "[External] llm quota exceeded",
		},
		{
			name:         "Internal error formatting",
			err:          errs.NewInternalError("database crashed", nil),
			expectedKind: errs.KindInternal,
			expectedStr:  "[Internal] database crashed",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.err.Kind != tc.expectedKind {
				t.Fatalf("expected kind %s, got %s", tc.expectedKind, tc.err.Kind)
			}
			if tc.err.Error() != tc.expectedStr {
				t.Fatalf("expected error string %q, got %q", tc.expectedStr, tc.err.Error())
			}
		})
	}
}

func TestBlotError_Unwrap(t *testing.T) {
	cause := errors.New("underlying disk failure")
	blotErr := errs.NewInternalError("failed to write file", cause)

	if !errors.Is(blotErr, cause) {
		t.Fatalf("expected errors.Is to match underlying cause")
	}
	if blotErr.Unwrap() != cause {
		t.Fatalf("expected Unwrap to return original cause")
	}
}
