const mysql = require('mysql2');
const inquirer = require('inquirer');

// Create a connection to the database
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "forever",
  database: "employee_tracking",
});

// Connect to the database
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');
  // Call a function to start your Employee Tracker application
    startEmployeeTracker();
});

function startEmployeeTracker() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Exit',
        ],
      },
    ])
    .then((answers) => {
      // Based on the user's choice, call the corresponding function
      switch (answers.action) {
        case 'View all departments':
          viewAllDepartments();
          break;
        case 'View all roles':
          viewAllRoles();
          break;
        case 'View all employees':
          viewAllEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
          case 'Exit':
            exitApplication(); // Call the function to exit the application
            break;
          default:
            console.log('Invalid choice');
            break;
      }
    });
}

function viewAllDepartments() {
  const query = 'SELECT * FROM department';

  connection.query(query, (err, results) => {
    if (err) throw err;

    console.log('List of Departments:');
    console.table(results);

    startEmployeeTracker();
  });
}

function viewAllRoles() {
  const query = 'SELECT * FROM role';

  connection.query(query, (err, results) => {
    if (err) throw err;

    console.log('List of Roles:');
    console.table(results);

    startEmployeeTracker();
  });
}

function viewAllEmployees() {
  const query = `
    SELECT e.id, e.first_name, e.last_name, r.title AS job_title, d.name AS department, 
    r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    LEFT JOIN role r ON e.role_id = r.id
    LEFT JOIN department d ON r.department_id = d.id
    LEFT JOIN employee m ON e.manager_id = m.id;
  `;

  connection.query(query, (err, results) => {
    if (err) throw err;

    console.log('List of Employees:');
    console.table(results);

    startEmployeeTracker();
  });
}

function addDepartment() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the name of the department:',
        validate: (input) => {
          if (input.trim() === '') {
            return 'Please enter a department name';
          }
          return true;
        },
      },
    ])
    .then((answers) => {
      const query = 'INSERT INTO department (name) VALUES (?)';

      connection.query(query, [answers.name], (err, results) => {
        if (err) throw err;

        console.log(`Department "${answers.name}" added successfully.`);
        startEmployeeTracker();
      });
    });
}

function addRole() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Enter the title of the role:',
        validate: (input) => {
          if (input.trim() === '') {
            return 'Please enter a role title';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'salary',
        message: 'Enter the salary for this role:',
        validate: (input) => {
          if (!/^\d+(\.\d{1,2})?$/.test(input)) {
            return 'Please enter a valid salary (e.g., 50000 or 55000.50)';
          }
          return true;
        },
      },
      
    ])
    .then((answers) => {
      const query = 'INSERT INTO role (title, salary) VALUES (?, ?)';

      connection.query(query, [answers.title, answers.salary], (err, results) => {
        if (err) throw err;

        console.log(`Role "${answers.title}" added successfully.`);
        startEmployeeTracker();
      });
    });
}

function addEmployee() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'first_name',
        message: "Enter the employee's first name:",
        validate: (input) => {
          if (input.trim() === '') {
            return 'Please enter the first name';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'last_name',
        message: "Enter the employee's last name:",
        validate: (input) => {
          if (input.trim() === '') {
            return 'Please enter the last name';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'role_id',
        message: "Enter the employee's role ID:",
        validate: (input) => {
          if (!/^\d+$/.test(input)) {
            return 'Please enter a valid role ID (a number)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'manager_id',
        message: "Enter the employee's manager's ID (or leave empty if none):",
      },
      // You can add more prompts as needed for other attributes
    ])
    .then((answers) => {
      const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)';

      connection.query(
        query,
        [answers.first_name, answers.last_name, answers.role_id, answers.manager_id || null],
        (err, results) => {
          if (err) throw err;

          console.log(`Employee "${answers.first_name} ${answers.last_name}" added successfully.`);
          startEmployeeTracker();
        }
      );
    });
}

function updateEmployeeRole() {
  // Create a query to retrieve a list of employees to choose from
  const employeesQuery = 'SELECT id, CONCAT(first_name, " ", last_name) AS full_name FROM employee';
  const rolesQuery = 'SELECT id, title FROM role';

  // Fetch employee and role data
  connection.query(employeesQuery, (err, employees) => {
    if (err) throw err;

    connection.query(rolesQuery, (err, roles) => {
      if (err) throw err;

      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employee_id',
            message: 'Select the employee to update:',
            choices: employees.map((employee) => ({
              name: employee.full_name,
              value: employee.id,
            })),
          },
          {
            type: 'list',
            name: 'new_role_id',
            message: 'Select the new role for the employee:',
            choices: roles.map((role) => ({
              name: role.title,
              value: role.id,
            })),
          },
        ])
        .then((answers) => {
          const query = 'UPDATE employee SET role_id = ? WHERE id = ?';

          connection.query(query, [answers.new_role_id, answers.employee_id], (err, results) => {
            if (err) throw err;

            console.log('Employee role updated successfully.');
            startEmployeeTracker();
          });
        });
    });
  });
}

function exitApplication() {
  console.log('Bye!');
  connection.end(); // Close the database connection
  process.exit(0); // Exit the Node.js process
}