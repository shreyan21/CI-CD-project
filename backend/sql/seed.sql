INSERT INTO profile(name, headline, location, summary, email, linkedin, github)
SELECT
  'Utkarsh Singh Rajawat',
  'Cloud Support • Linux • APIs • DevOps in progress',
  'Lucknow, India',
  'Technical support and backend professional with nearly 2 years of relevant experience troubleshooting Linux-based services, REST APIs, PostgreSQL workflows and automated jobs. I am now turning that operations foundation into hands-on DevOps and cloud engineering proof.',
  'rajawatshrayansh@gmail.com',
  'https://linkedin.com/in/utkarsh-singh-rajawat',
  'https://github.com/shreyan21'
WHERE NOT EXISTS (SELECT 1 FROM profile);

INSERT INTO skills(category, name, level, sort_order) VALUES
('Cloud', 'AWS EC2', 'Working knowledge', 10),
('Cloud', 'IAM', 'Working knowledge', 20),
('Cloud', 'S3', 'Working knowledge', 30),
('Cloud', 'EBS', 'Working knowledge', 40),
('Systems', 'Linux / Unix', 'Developing', 50),
('Containers', 'Docker', 'Hands-on', 60),
('Version Control', 'Git / GitHub', 'Hands-on', 70),
('Backend', 'Node.js / Express', 'Hands-on', 80),
('Data', 'PostgreSQL / PostGIS', 'Hands-on', 90),
('APIs', 'REST / HTTP / JSON', 'Hands-on', 100),
('Tools', 'Postman', 'Hands-on', 110),
('Languages', 'JavaScript', 'Hands-on', 120),
('Languages', 'Python', 'Fundamentals', 130),
('Languages', 'C / C++', 'Working knowledge', 140)
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO experience(company, role, period, location, sort_order)
SELECT values_row.* FROM (VALUES
  ('Remote Sensing Applications Centre (RSAC), Govt. of Uttar Pradesh', 'Project Scientist – API & Production Support', '09/2025 – Present', 'Lucknow, India', 10),
  ('Cognizant', 'Programmer Analyst Trainee', '10/2022 – 07/2023', 'India', 20),
  ('Cognizant', 'Technology Intern', '03/2022 – 08/2022', 'India', 30)
) AS values_row(company, role, period, location, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM experience);

INSERT INTO experience_bullets(experience_id, body, sort_order)
SELECT values_row.* FROM (VALUES
  (1, 'Support Linux-based Node.js/Express APIs and PostgreSQL/PostGIS workflows covering 100+ mining-site records.', 10),
  (1, 'Investigate incidents across API, database, background jobs and Linux services using logs, SQL and service checks.', 20),
  (1, 'Trace REST/JSON requests end-to-end, reproduce failures and separate application, data and service issues before escalation.', 30),
  (2, 'Completed approximately 9 months of enterprise engineering training in JavaScript, Node.js, PostgreSQL, REST APIs, debugging and Git.', 10),
  (2, 'Built and debugged REST endpoints and payloads using SQL and application analysis.', 20),
  (3, 'Completed 6 months of structured training in programming, relational databases and software debugging.', 10)
) AS values_row(experience_id, body, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM experience_bullets);

INSERT INTO certifications(title, sort_order) VALUES
('Introduction to IT & AWS Cloud — Coursera / AWS (2026)', 10),
('Postman API Fundamentals Student Expert (2024)', 20),
('SQL Intermediate — HackerRank (2024)', 30),
('AWS CLF-C02 Exam Preparation — In Progress', 40)
ON CONFLICT (title) DO NOTHING;
