hex_data = "f65dafc231c44180596cac45b440d41d0905d5019a17bbfdcc9b6b35b5f91a049ae126d5db08f88e10a2d8ac4b29f195417f35a7b186824cc57c07ca61955707dd34ce4484bb424bb48d6c575a4716e696e8147909204da23e7ef0f0ade8c94be39d99c2"

with open("encrypted_data.bin", "wb") as f:
    f.write(bytes.fromhex(hex_data))