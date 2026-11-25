package sysutil_test

import (
	"context"
	"os/exec"
	"runtime"
	"syscall"
	"testing"

	"buildui/internal/sysutil"
)

func TestHideWindow_NilCommand(t *testing.T) {
	// 验证传入 nil 时不会发生 panic
	sysutil.HideWindow(nil)
}

func TestHideWindow_Command(t *testing.T) {
	cmd := exec.Command("cmd.exe", "/c", "echo test")
	sysutil.HideWindow(cmd)

	if runtime.GOOS == "windows" {
		if cmd.SysProcAttr == nil {
			t.Fatal("expected SysProcAttr to be allocated on Windows, got nil")
		}
		if !cmd.SysProcAttr.HideWindow {
			t.Errorf("expected HideWindow to be true on Windows")
		}
		const expectedFlag = 0x08000000 // CREATE_NO_WINDOW
		if cmd.SysProcAttr.CreationFlags&expectedFlag == 0 {
			t.Errorf("expected CreationFlags to include 0x%08X on Windows, got 0x%08X", expectedFlag, cmd.SysProcAttr.CreationFlags)
		}
	}
}

func TestHideWindow_PreserveExistingSysProcAttr(t *testing.T) {
	cmd := exec.Command("cmd.exe", "/c", "echo test")
	cmd.SysProcAttr = &syscall.SysProcAttr{}

	sysutil.HideWindow(cmd)

	if runtime.GOOS == "windows" {
		if !cmd.SysProcAttr.HideWindow {
			t.Errorf("expected HideWindow to be true")
		}
		const expectedFlag = 0x08000000
		if cmd.SysProcAttr.CreationFlags&expectedFlag == 0 {
			t.Errorf("expected CreationFlags to include 0x%08X", expectedFlag)
		}
	}
}

func TestCommand(t *testing.T) {
	cmd := sysutil.Command("git", "status")
	if cmd == nil {
		t.Fatal("expected non-nil cmd")
	}
	if len(cmd.Args) != 2 || cmd.Args[0] != "git" || cmd.Args[1] != "status" {
		t.Errorf("unexpected args: %v", cmd.Args)
	}

	if runtime.GOOS == "windows" {
		if cmd.SysProcAttr == nil || !cmd.SysProcAttr.HideWindow {
			t.Errorf("expected HideWindow to be true for sysutil.Command on Windows")
		}
	}
}

func TestCommandContext(t *testing.T) {
	ctx := context.Background()
	cmd := sysutil.CommandContext(ctx, "git", "status")
	if cmd == nil {
		t.Fatal("expected non-nil cmd")
	}
	if len(cmd.Args) != 2 || cmd.Args[0] != "git" || cmd.Args[1] != "status" {
		t.Errorf("unexpected args: %v", cmd.Args)
	}

	if runtime.GOOS == "windows" {
		if cmd.SysProcAttr == nil || !cmd.SysProcAttr.HideWindow {
			t.Errorf("expected HideWindow to be true for sysutil.CommandContext on Windows")
		}
	}
}
