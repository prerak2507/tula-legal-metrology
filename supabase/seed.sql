-- Seed Data for Legal Metrology Verification System
-- Department of Consumer Affairs, Government of India

-- Seed Users
INSERT INTO users (id, email, full_name, organization, role, phone, address, state, district, designation, badge_number, gatc_code, jurisdiction_office)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'business@demo.gov.in', 'Rajesh Varma', 'Apex Agro Logistics & Retail Pvt Ltd', 'BUSINESS', '+91 98101 23456', 'Plot 42, Okhla Industrial Area Phase-III', 'Delhi', 'South Delhi', 'General Manager (Operations)', NULL, NULL, NULL),
('a0000000-0000-0000-0000-000000000002', 'lmo@demo.gov.in', 'Inspector Amit K. Sharma', 'Office of the Controller of Legal Metrology, GNCTD', 'LMO', '+91 98712 34567', 'Zonal Metrology Office, Vikas Bhawan, New Delhi', 'Delhi', 'Central Delhi', 'Legal Metrology Officer (Inspector Grade-I)', 'DL-LMO-042', NULL, 'Delhi Central & South Zonal Laboratory'),
('a0000000-0000-0000-0000-000000000003', 'gatc@demo.gov.in', 'Dr. Hardik Patel', 'Gujarat Metrology Calibration & Testing Centre', 'GATC', '+91 94280 12345', 'GIDC Industrial Metrology Park, Vatva', 'Gujarat', 'Ahmedabad', 'Director of Metrological Verifications', NULL, 'GATC-GJ-2026-08', 'DoCA Accredited Regional Test Facility'),
('a0000000-0000-0000-0000-000000000004', 'controller@demo.gov.in', 'Sunita Meena, IAS', 'Department of Consumer Affairs, Delhi HQ', 'CONTROLLER', '+91 99100 88776', 'C-Block, Vikas Bhawan', 'Delhi', 'Central Delhi', 'Controller of Legal Metrology', NULL, NULL, NULL),
('a0000000-0000-0000-0000-000000000005', 'stateadmin@demo.gov.in', 'Bhavna Jadav', 'Commissionerate of Consumer Affairs, Gujarat', 'STATE_ADMIN', '+91 97123 45678', 'Udyog Bhavan, Sector 11, Gandhinagar', 'Gujarat', 'Gandhinagar', 'Joint Director (IT)', NULL, NULL, NULL),
('a0000000-0000-0000-0000-000000000006', 'centraladmin@demo.gov.in', 'Venkatesh Ramanathan', 'Department of Consumer Affairs, Krishi Bhawan', 'CENTRAL_ADMIN', '+91 98111 00223', 'Krishi Bhawan, New Delhi', 'Delhi', 'New Delhi', 'Director (Legal Metrology Standards)', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Fee Rules
INSERT INTO fee_rules (id, jurisdiction, category, capacity_range, statutory_fee, user_charge, effective_from, rule_citation)
VALUES
('FEE-01', 'NATIONAL', 'NON_AUTOMATIC_WEIGHING', 'Up to 50 kg', 200, 50, '2024-04-01', 'First Schedule, Legal Metrology (General) Rules, 2011'),
('FEE-02', 'NATIONAL', 'PLATFORM_SCALE', '50 kg to 500 kg', 500, 100, '2024-04-01', 'First Schedule, Legal Metrology (General) Rules, 2011'),
('FEE-03', 'NATIONAL', 'WEIGHBRIDGE', '10 tonnes to 100 tonnes', 4000, 500, '2024-04-01', 'First Schedule, Legal Metrology (General) Rules, 2011'),
('FEE-04', 'NATIONAL', 'FUEL_DISPENSER_PETROL_DIESEL', 'Single/Multi Nozzle Delivery', 2000, 300, '2026-01-01', 'GATC Amendment Rules 2026'),
('FEE-05', 'NATIONAL', 'FUEL_DISPENSER_CNG', 'Dual Hose Mass Flow', 3000, 400, '2026-01-01', 'GATC Amendment Rules 2026')
ON CONFLICT (id) DO NOTHING;

-- Seed Instruments
INSERT INTO instruments (id, category, category_name, accuracy_class, manufacturer, model, model_approval_number, serial_number, capacity, scale_interval, purchase_date, installation_date, owner_id, owner_name, organization, installation_address, state, district, latitude, longitude, status, last_verification_date, next_verification_due_date, current_certificate_id, current_stamp_id)
VALUES
('LM-DL-2026-001290', 'NON_AUTOMATIC_WEIGHING', 'Electronic Platform Scale (Class III)', 'CLASS_III', 'Avery India Metrology Ltd', 'IND-9000-X', 'IND/09/2023/184', 'SN-AVR-90412', '150 kg', 'e = 20 g, d = 5 g', '2023-05-14', '2023-05-20', 'a0000000-0000-0000-0000-000000000001', 'Rajesh Varma', 'Apex Agro Logistics & Retail Pvt Ltd', 'Warehouse Bay 4, Okhla Ind Area Phase-III, New Delhi', 'Delhi', 'South Delhi', 28.5292, 77.2713, 'ACTIVE', '2026-01-18', '2027-01-17', 'CERT-2026-08912', 'STAMP-DL-26-0842'),
('LM-GJ-2026-000412', 'WEIGHBRIDGE', 'Road Pitless Weighbridge (100 Tonne)', 'CLASS_III', 'Eagle Scale Systems India', 'WB-P100T', 'IND/09/2022/912', 'SN-WB-88129', '100,000 kg', 'e = 10 kg, d = 5 kg', '2022-10-05', '2022-11-12', 'a0000000-0000-0000-0000-000000000001', 'Rajesh Varma', 'Apex Agro Logistics & Retail Pvt Ltd', 'Logistics Terminal Gate 2, Mundra Port Road, Ahmedabad', 'Gujarat', 'Ahmedabad', 23.0225, 72.5714, 'EXPIRING_SOON', '2025-10-18', '2026-10-17', 'CERT-2025-04182', 'STAMP-GJ-25-4190'),
('LM-MH-2026-003819', 'FUEL_DISPENSER_PETROL_DIESEL', 'Multi-Product Fuel Dispenser (MPD 4-Nozzle)', 'SPECIAL', 'Tokheim India Tech', 'Quantium-510', 'IND/09/2021/304', 'SN-TK-51082', '45 Litres / min', 'e = 0.01 L, d = 0.005 L', '2021-08-20', '2021-09-01', 'a0000000-0000-0000-0000-000000000001', 'Rajesh Varma', 'Apex Agro Logistics & Retail Pvt Ltd', 'Retail Fuel Outlet 14, Western Express Highway, Mumbai', 'Maharashtra', 'Mumbai Suburban', 19.0760, 72.8777, 'EXPIRED', '2025-09-15', '2026-09-14', 'CERT-2025-09124', 'STAMP-MH-25-1102'),
('LM-DL-2026-001550', 'COUNTER_MACHINE', 'Precision Commercial Counter Scale (Class III)', 'CLASS_III', 'Essae-Teraoka Ltd', 'DS-215-HD', 'IND/09/2023/512', 'SN-ESS-51209', '30 kg', 'e = 5 g, d = 1 g', '2026-02-01', '2026-02-15', 'a0000000-0000-0000-0000-000000000001', 'Rajesh Varma', 'Apex Agro Logistics & Retail Pvt Ltd', 'Central Supermarket Outlet, Connaught Place, New Delhi', 'Delhi', 'Central Delhi', 28.6315, 77.2167, 'REGISTERED', NULL, '2026-03-31', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
