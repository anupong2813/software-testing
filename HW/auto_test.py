import subprocess
import sys
import os # เพิ่ม import os

# ดึงที่อยู่ของโฟลเดอร์ปัจจุบันแบบอัตโนมัติ
current_dir = os.path.dirname(os.path.abspath(__file__))
# ระบุไฟล์ที่ต้องการรัน (เปลี่ยน main.py เป็นชื่อไฟล์โค้ดที่ 1 ของคุณ)
target_file = os.path.join(current_dir, 'main.py') 

def run_testcase(test_id, input_data):
    print(f"\n{test_id}")
    try:
        process = subprocess.Popen(
            [sys.executable, target_file], # ใช้ sys.executable และ target_file แทน
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
# ... (โค้ดส่วนที่เหลือเหมือนเดิม) ...
        stdout, stderr = process.communicate(input=input_data, timeout=2)
        
        # กรองเฉพาะข้อความบรรทัดสุดท้ายมาแสดงผล
        lines = stdout.strip().split('\n')
        if lines:
            print("Result ->", lines[-1])
        if stderr:
            print("Error ->", stderr.strip())
            
    except Exception as e:
        print("Execution failed:", e)

# รัน Test Case ตามตารางที่ออกแบบไว้ (ใช้ \n แทนการกด Enter)
if __name__ == "__main__":
    print("=== Start Automated Testing ===")
    
    # TC-01: ใส่ choice = 4
    run_testcase("TC-01 (Path 1: Invalid Choice)", "Anupong\n4\n")
    
    # TC-02: Boundary, 0 cases
    run_testcase("TC-02 (Path 2: Boundary, No Data)", "Anupong\n1\n0\n")
    
    # TC-03: Robustness, 0 cases
    run_testcase("TC-03 (Path 3: Robustness, No Data)", "Anupong\n2\n0\n")
    
    # TC-04: Worst Case, 0 cases
    run_testcase("TC-04 (Path 4: Worst Case, No Data)", "Anupong\n3\n0\n")
    
    # TC-05: Boundary, 1 case, W=10, H=5 (ค่าปกติ)
    run_testcase("TC-05 (Path 5: Normal Calculation)", "Anupong\n1\n1\n10\n5\n")
    
    # TC-06: Boundary, 1 case, W=-2, H=5 (ค่า Error)
    run_testcase("TC-06 (Path 6: Error Input)", "Anupong\n1\n1\n-2\n5\n")
    
    print("\n=== All Tests Completed ===")