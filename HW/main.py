#1 เขียนโปรแกรมสร้าง test case
#6630202589 นายภัครพงษ์ กุลสุวรรณ์
#6630202813 นายอนุพงศ์ ดวงสิมมา

from datetime import datetime

tester_name = input("Enter Tester Name: ")

print("\nSelect Test Type")
print("1. Boundary Value Analysis")
print("2. Robustness Testing")
print("3. Worst Case Testing")

choice = int(input("Enter choice (1-3): "))

if choice == 1:
    test_type = "Boundary"
elif choice == 2:
    test_type = "Robustness"
elif choice == 3:
    test_type = "Worst Case"
else:
    print("Invalid choice")
    exit()

start_time = datetime.now()
time_str = start_time.strftime('%Y%m%d_%H%M%S')
log_file = f"ExecuteLog_{time_str}.txt"
count = 0

total_cases = int(input(f"Enter number of {test_type} test cases: "))

with open(log_file, "w", encoding="utf-8") as f:
    f.write(f"Tester Name : {tester_name}\n")
    f.write(f"Test Type : {test_type}\n")
    f.write(f"DateTime Generate : {start_time.strftime('%d/%m/%Y %H:%M:%S')}\n")
    f.write("--------------------------------------------------\n")
    f.write("TestCase, W, H, Area\n")

    for i in range(1, total_cases + 1):
        print(f"\n{test_type} Test case {i}")
        W = float(input("Enter Wide (W): "))
        H = float(input("Enter Height (H): "))

        try:
            if W <= 0 or H <= 0:
                raise ValueError

            area = (W * H) / 2
            f.write(f"{i}, {W}, {H}, {area}\n")
            print(f"Area = {area}")
        except:
            f.write(f"{i}, {W}, {H}, ERROR\n")
            print("ERROR : Invalid input")

        count += 1

    finish_time = datetime.now()
    f.write("--------------------------------------------------\n")
    f.write(f"DateTime finish : {finish_time.strftime('%d/%m/%Y %H:%M:%S')}\n")
    f.write(f"Total number of test case : {count}\n")

print("\nProgram finished.")
print(f"Total number of test case : {count}")
print(f"Log saved to {log_file}")
