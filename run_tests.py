#!/usr/bin/env python3
"""
Automated test runner for Buddy AI Assistant
"""
import subprocess
import sys

def run_test(name, command):
    """Run a test command and report results"""
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        if result.returncode == 0:
            print(f"✅ {name} PASSED")
            return True
        else:
            print(f"❌ {name} FAILED (exit code: {result.returncode})")
            return False
    except subprocess.TimeoutExpired:
        print(f"⏱️ {name} TIMEOUT")
        return False
    except Exception as e:
        print(f"❌ {name} ERROR: {e}")
        return False

def main():
    print("=" * 60)
    print("BUDDY AI ASSISTANT - TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Syntax Check", "python test_syntax.py"),
        ("PyTorch Import", 'python -c "import torch; print(torch.__version__)"'),
        ("Transformers Import", 'python -c "import transformers; print(transformers.__version__)"'),
        ("Core Module", 'python -c "from core import BuddyCore; print(\'Core loaded\')"'),
        ("Speech Module", 'python -c "from speech import VoiceInput, TTS; print(\'Speech loaded\')"'),
        ("Utils Module", 'python -c "from utils import safety_filter; print(safety_filter(\'test\'))"'),
        ("Config Module", 'python -c "from config import MODEL_NAME; print(MODEL_NAME)"'),
    ]
    
    results = {}
    for test_name, test_cmd in tests:
        results[test_name] = run_test(test_name, test_cmd)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    failed = sum(1 for v in results.values() if not v)
    
    print(f"✅ Passed: {passed}/{len(tests)}")
    print(f"❌ Failed: {failed}/{len(tests)}")
    
    print("\nDetailed Results:")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️ {failed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
