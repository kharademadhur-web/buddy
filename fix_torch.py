#!/usr/bin/env python3
"""
Script to fix PyTorch DLL loading issues on Windows by reinstalling CPU version
"""
import subprocess
import sys

def run_command(cmd):
    """Run a command and print output"""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    return result.returncode

def main():
    print("=" * 60)
    print("PyTorch Reinstallation Script")
    print("=" * 60)
    
    # Step 1: Uninstall existing torch packages
    print("\n[1/2] Uninstalling existing PyTorch packages...")
    uninstall_code = run_command([
        sys.executable, "-m", "pip", "uninstall", "-y",
        "torch", "torchvision", "torchaudio"
    ])
    
    # Step 2: Install CPU-only version
    print("\n[2/2] Installing PyTorch CPU version...")
    install_code = run_command([
        sys.executable, "-m", "pip", "install", "--user",
        "torch", "torchvision", "torchaudio",
        "--index-url", "https://download.pytorch.org/whl/cpu"
    ])
    
    if install_code == 0:
        print("\n✅ PyTorch reinstalled successfully!")
        print("You can now run the application.")
    else:
        print("\n❌ Installation failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
