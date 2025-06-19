print("Starting...")
def main():
    print("About to fail...")
    1/0  # This will cause a ZeroDivisionError

if __name__ == "__main__":
    main()