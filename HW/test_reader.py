#2 เขียนโปรแกรมอ่าน test case จากไฟล์
#6630202589 นายภัครพงษ์ กุลสุวรรณ์
#6630202813 นายอนุพงศ์ ดวงสิมมา

from datetime import datetime

def CalTriangleSpace(W, H):
    try:
        w_val = float(W)
        h_val = float(H)
        if w_val <= 0 or h_val <= 0:
            return "ERROR"
        return (w_val * h_val) / 2
    except:
        return "ERROR"

tester_name = input("Enter Tester Name: ")

input_file = "ExecuteLog.txt"
output_file = "TestResult_Report.txt"

total_test = 0
pass_count = 0
fail_count = 0

start_time = datetime.now()

print(f"Reading test cases from {input_file}...")

with open(input_file, "r", encoding="utf-8") as fin, open(output_file, "w", encoding="utf-8") as fout:
    fout.write(f"Test Report for: {tester_name}\n")
    fout.write(f"Start Test at: {start_time.strftime('%d/%m/%Y %H:%M:%S')}\n")
    fout.write("-" * 50 + "\n")
    fout.write("ID, W, H, Calculated, Expected, Result\n")

    lines = fin.readlines()
    for line in lines:
        if "," not in line or "TestCase" in line:
            continue
            
        parts = line.strip().split(", ")
        tc_id = parts[0]
        w = parts[1]
        h = parts[2]
        expected = parts[3] 

        actual_area = CalTriangleSpace(w, h)

        is_pass = str(actual_area) == expected
        
        result_text = "Pass" if is_pass else "Fail"
        if is_pass:
            pass_count += 1
        else:
            fail_count += 1
        total_test += 1

        fout.write(f"{tc_id}, {w}, {h}, {actual_area}, {expected}, {result_text}\n")

    finish_time = datetime.now()
    fout.write("-" * 50 + "\n")
    fout.write(f"End of test at : {finish_time.strftime('%d/%m/%Y %H:%M:%S')}\n")
    fout.write(f"Number of test : {total_test}\n")
    fout.write(f"Number of pass : {pass_count}\n")
    fout.write(f"Number of fail : {fail_count}\n")

print(f"Test completed! Report saved to {output_file}")