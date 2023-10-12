## Instruction

1. Write command `npm i` in terminal for install node_modules folder.
2. Create postgres database and connect to project, for example I created by command `docker run --name test_task -e POSTGRES_PASSWORD=12345 -e POSTGRES_USER=postgres_user -e POSTGRES_DB=postgres_db -p 5432:5432 -d postgres`, you can use it.
3. Write command `npx knex migrate:up` in terminal for creating tables in database. If you want to delete database tables you can write `npx knex migrate:up` in terminal.
4. Write `npm start` in terminal for starting project. If all run without problems go to 5 step, if no please check 1,2,3 steps again.
5. Make GET request by url `http://localhost:4507/import` for save data from `dump.file.txt` into database.
6. (Optional) Make GET request by url `http://localhost:4507/data` for check data in database.
7. Make GET request by url `http://localhost:4507/api/top_exchangers` or `http://localhost:4507/api/top_exchangers_by_query` for check top exchangers.

## Answers

1. How to change the code to support different file format versions?
   a: Read the file extension. Depending on it, we choose the necessary parser through the class factory.

2. How will the import system change if in the future we need to get this data from a web API?
   a: Use stream.

3. If in the future it will be necessary to do the calculations using the national bank rate, how could this be added to the system?
   a: We get the desired rate by requesting the API and we could count.

4. How would it be possible to speed up the execution of requests if the task allowed you to update market data once a day or even less frequently? Please explain all possible solutions you could think of.
   a: Use cache. Cron which feeds cache data.
