import datetime

def run_test_logger():
    # --- 0. Ask for Tester Name ---
    # รับชื่อผู้ทดสอบและเก็บไว้ในตัวแปร tester_name
    tester_name = input("Enter Tester Name: ")

    # --- 1. Input Wide and Height ---
    # รับค่า W และ H โดยใช้ float() เพื่อให้คำนวณทศนิยมได้
    try:
        w = float(input("Enter Wide (W): "))
        h = float(input("Enter Height (H): "))
    except ValueError:
        print("Error: Please enter only numeric values.")
        return

    # --- 2. Select Test Type ---
    # แสดงเมนูให้เลือกประเภทการทดสอบ
    print("\nSelect Test Data Type:")
    print("[1] BVA")
    print("[2] Robustness")
    print("[3] Worse case")
    print("[4] Worse case Robustness")
    
    choice = input("Enter choice (1-4): ")
    
    # ตรวจสอบว่าผู้ใช้เลือกข้อไหน และเก็บชื่อประเภทไว้ใน test_type
    test_types = {"1": "BVA", "2": "Robustness", "3": "Worse case", "4": "Worse case Robustness"}
    selected_type = test_types.get(choice, "Unknown Type")

    # --- 3. Calculate Triangle Area ---
    # คำนวณพื้นที่สามเหลี่ยม: (กว้าง * สูง) / 2
    area = (w * h) / 2
    
    # บันทึกเวลาที่เริ่มทำงาน
    start_time = datetime.datetime.now()

    # --- 4. Write to ExecuteLog file ---
    # ใช้คำสั่ง open พร้อมโหมด 'a' (Append) เพื่อเขียนข้อมูลต่อท้ายไฟล์เดิม
    # encoding="utf-8" ช่วยให้รองรับภาษาไทยในชื่อได้ถ้ามี
    with open("ExecuteLog.txt", "a", encoding="utf-8") as log_file:
        log_file.write(f"Tester Name : {tester_name}\n")
        log_file.write(f"DateTime Generate : {start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        log_file.write(f"Test Type: {selected_type}\n")
        
        # ส่วนของ Loop และการนับจำนวน Test Case
        log_file.write("Loop :\n")
        count = 0
        
        # ตัวอย่างการบันทึกข้อมูล 1 Test Case (สามารถปรับเป็น Loop จริงได้ในอนาคต)
        test_case_number = 1
        log_file.write(f"   Write ({test_case_number}, {w}, {h}, {area})\n")
        count += 1
        
        # บันทึกเวลาที่สิ้นสุด
        finish_time = datetime.datetime.now()
        log_file.write(f"DateTime finish : {finish_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        log_file.write(f"Total number of test case :> {count}\n")
        log_file.write("-" * 40 + "\n")

    print("\nSuccess! Data has been written to 'ExecuteLog.txt'")

# รันโปรแกรม
if __name__ == "__main__":
    run_test_logger()