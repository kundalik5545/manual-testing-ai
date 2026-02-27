export const sqlScripts = {
  Q1: `SELECT
    m.member_id,
    m.member_number,
    m.surname,
    m.first_name,
    m.ni_number,
    m.date_of_birth,
    s.scheme_name,
    at.team_name AS administration_team
FROM
    members m
INNER JOIN
    schemes s ON m.scheme_id = s.scheme_id
LEFT JOIN
    administration_teams at ON s.admin_team_id = at.team_id
WHERE
    m.ni_number = 'AB123456C';
`,

  Q2: `
SELECT
    m.member_id,
    m.member_number,
    m.surname,
    m.first_name,
    m.ni_number,
    m.date_of_birth,
    s.scheme_name
FROM
    members m
INNER JOIN
    schemes s ON m.scheme_id = s.scheme_id
WHERE
    m.surname LIKE 'Smi%'
ORDER BY
    m.surname,
    m.first_name;
`,

Q3:`
SELECT 
    m.member_id, 
    m.member_number, 
    m.surname, 
    m.first_name, 
    m.ni_number, 
    m.date_of_birth, 
    s.scheme_name 
FROM 
    members m 
INNER JOIN 
    schemes s ON m.scheme_id = s.scheme_id 
WHERE 
    m.date_of_birth = '1980-01-01' 
ORDER BY 
    m.surname, m.first_name;
`,

Q4:`
SELECT 
    m.member_id, 
    m.member_number, 
    m.surname, 
    m.first_name, 
    m.ni_number, 
    m.date_of_birth, 
    s.scheme_name 
FROM 
    members m 
INNER JOIN 
    schemes s ON m.scheme_id = s.scheme_id 
WHERE 
    m.date_of_birth = '1980-01-01' 
ORDER BY 
    m.surname, m.first_name;`,

Q5:`
SELECT 
    m.member_id, 
    m.member_number, 
    m.surname, 
    m.first_name, 
    m.ni_number, 
    m.date_of_birth, 
    s.scheme_name 
FROM 
    members m 
INNER JOIN 
    schemes s ON m.scheme_id = s.scheme_id 
WHERE 
    m.date_of_birth = '1980-01-01' 
ORDER BY 
    m.surname, m.first_name;`

};