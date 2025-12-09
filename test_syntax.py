#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to check for syntax errors and basic imports
"""
import sys
import py_compile
import os

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def test_file_syntax(filepath):
    """Test if a Python file has valid syntax"""
    try:
        py_compile.compile(filepath, doraise=True)
        print(f"✅ {os.path.basename(filepath)}: Syntax OK")
        return True
    except py_compile.PyCompileError as e:
        print(f"❌ {os.path.basename(filepath)}: Syntax Error")
        print(f"   {e}")
        return False

def test_import(module_name, filepath):
    """Test if a module can be imported (checking structure, not runtime)"""
    # We'll just check syntax for now since torch has DLL issues
    return test_file_syntax(filepath)

if __name__ == "__main__":
    project_dir = os.path.dirname(os.path.abspath(__file__))
    
    python_files = [
        "app.py",
        "buddy_api.py",
        "config.py",
        "core.py",
        "emotion_engine.py",
        "lightweight_buddy.py",
        "phi_inference.py",
        "speech.py",
        "start_buddy.py",
        "utils.py"
    ]
    
    print("=" * 60)
    print("SYNTAX CHECK")
    print("=" * 60)
    
    results = {}
    for pyfile in python_files:
        filepath = os.path.join(project_dir, pyfile)
        if os.path.exists(filepath):
            results[pyfile] = test_file_syntax(filepath)
        else:
            print(f"⚠️  {pyfile}: File not found")
            results[pyfile] = None
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    missing = sum(1 for v in results.values() if v is None)
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️  Missing: {missing}")
    
    if failed > 0:
        print("\nFiles with errors:")
        for fname, result in results.items():
            if result is False:
                print(f"  - {fname}")
        sys.exit(1)
    else:
        print("\n🎉 All files have valid syntax!")
        sys.exit(0)
