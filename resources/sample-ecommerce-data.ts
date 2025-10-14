import { DataQualityInputs, TableInput } from '../types';

// The raw data definition, omitting 'id' from tables, which will be added dynamically.
type RawDataQualityInputs = Omit<DataQualityInputs, 'tables'> & {
  tables: Omit<TableInput, 'id'>[];
};

export const sampleEcommerceData: RawDataQualityInputs = {
  tables: [
    {
      name: 'dbo.customers',
      stats: `Column, Null %, Distinct Count, Min, Max
customer_id, 0%, 5000, 1, 5000
email, 15%, 4250, N/A, N/A
phone_number, 2%, 4890, N/A, N/A
registration_date, 0%, 1500, 2021-01-15, 2024-05-20
country_code, 0.5%, 15, N/A, N/A`,
      schema: `-- Current Schema
CREATE TABLE dbo.customers (
  customer_id INT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100),
  phone_number VARCHAR(25),
  registration_date DATE,
  country_code VARCHAR(3) -- Note: Should be VARCHAR(2) for ISO codes
);`,
      samples: `customer_id,first_name,last_name,email,phone_number,registration_date,country_code
101,John,Smith,john.s@example.com,(123) 456-7890,2022-03-10,US
102,Jane,Doe,,123-456-7891,2022-03-11,USA
103,Peter,Jones,peter.jones@example.com,456-7890,2022-03-12,CA
104,Mary,Johnson,mary.j@example.com,NULL,2022-03-13,GB
105,Jane,Doe,,123-456-7891,2023-01-05,USA`,
      rules: `email must be a valid email format and should not be null.
phone_number must follow a consistent format.
country_code must be a 2-letter ISO country code.`,
    },
    {
      name: 'sales.orders',
      stats: `Column, Null %, Distinct Count, Min, Max
order_id, 0%, 10000, 1, 10000
customer_id, 1%, 4950, 1, 5050
order_total, 0.2%, 8000, -50.00, 25000.00
quantity, 0%, 25, 1, 25
order_status, 0%, 5, N/A, N/A`,
      schema: `-- Previous Schema (from Q1)
CREATE TABLE sales.orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  order_date DATETIME,
  order_total DECIMAL(10, 2),
  order_status INT -- 1:Pending, 2:Shipped, 3:Delivered
);

-- Current Schema
CREATE TABLE sales.orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  order_date DATETIME,
  order_total DECIMAL(10, 2),
  order_status VARCHAR(20), -- Now a string
  shipping_method VARCHAR(50) -- New column added
);`,
      samples: `order_id,customer_id,order_date,order_total,order_status,shipping_method
8001,101,2024-05-15,150.50,Shipped,Standard
8002,5025,2024-05-15,75.00,Pending,Express
8003,205,2024-05-16,-50.00,Shipped,Standard
8004,310,2024-05-16,3,NULL
8005,NULL,2024-05-17,200.00,Pending,Overnight`,
      rules: `order_total must be greater than or equal to 0.
customer_id must exist in the dbo.customers table.`,
    },
    {
      name: 'sales.order_items',
      stats: `Column, Null %, Distinct Count, Min, Max
order_item_id, 0%, 15000, 1, 15000
order_id, 0%, 9950, 8001, 8005
product_id, 0%, 950, 100, 104
quantity, 0%, 25, 1, 10
price_per_unit, 0%, 800, 0.00, 1999.99`,
      schema: `CREATE TABLE sales.order_items (
  order_item_id INT PRIMARY KEY,
  order_id INT, -- Foreign key to sales.orders
  product_id INT, -- Foreign key to inventory.products
  quantity INT,
  price_per_unit DECIMAL(10, 2)
);`,
      samples: `order_item_id,order_id,product_id,quantity,price_per_unit
1,8001,100,1,1200.00
2,8001,101,2,25.00
3,8002,103,1,80.00
4,8003,104,1,45.00
5,8004,101,5,25.00`,
      rules: `quantity must be > 0.
price_per_unit must be >= 0.
order_id must exist in the sales.orders table.
product_id must exist in the inventory.products table.`,
    },
    {
      name: 'inventory.products',
      stats: `Column, Null %, Distinct Count, Min, Max
product_id, 0%, 1000, 1, 1000
sku, 0%, 998, N/A, N/A
product_description, 45%, 550, N/A, N/A
category, 1%, 10, N/A, N/A
price, 0.5%, 800, 0.00, 1999.99`,
      schema: `CREATE TABLE inventory.products (
  product_id INT PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(150),
  product_description TEXT,
  category VARCHAR(50),
  price DECIMAL(10, 2),
  stock_quantity INT
);`,
      samples: `product_id,sku,product_name,category,price
100,SKU-A1,Laptop,Electronics,1200.00
101,SKU-B2,Mouse,electronics,25.00
102,SKU-C3,Keyboard,NULL,75.00
103,SKU-D4,Webcam,Electronics,80.00
104,SKU-B2,Gaming Mouse,Electronics,45.00`,
      rules: `sku must be unique.
category should be one of: Electronics, Books, Clothing, Home Goods.
Every product must have a product_description.`,
    },
  ],
  rules: `All ID columns (e.g., customer_id, order_id) must be positive integers.
Dates and timestamps must not be in the future.
All table names must follow the [schema].[table_name] format.`,
  history: `Last month, an ETL failure caused a spike in NULL 'email' addresses in the 'dbo.customers' table.
The 'order_status' field in 'sales.orders' was migrated from an integer-based system to a string-based system in Q2. Some legacy data might still reflect the old system.`,
};
