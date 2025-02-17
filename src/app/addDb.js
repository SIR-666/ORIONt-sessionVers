const sql = require("mssql");

async function createTable(pool, query) {
    try {
      const request = pool.request();
      await request.query(query);
      console.log("Table created successfully or already exist");
    } catch (error) {
      console.error("Error creating table:", error);
      throw error;
    }
}

async function createTables(config) {
        try {
          const pool = await sql.connect(config);
      
          const tableProdPO = `
            IF OBJECT_ID('dbo.Product', 'U') IS NULL
            BEGIN
            CREATE TABLE [dbo].[Product] (
              [id] int IDENTITY(1,1) NOT NULL UNIQUE,
              [name] nvarchar(255) NOT NULL,
              [category] nvarchar(3) NOT NULL,
              [volume] int NOT NULL,
              [created_at] datetime NOT NULL,
              [updated_at] datetime NOT NULL,
              [flag] int NOT NULL,
              PRIMARY KEY ([id])
              );
            END;
            
            IF OBJECT_ID('dbo.ProductionOrder', 'U') IS NULL
              BEGIN
            CREATE TABLE [dbo].[ProductionOrder] (
              [id] int NOT NULL UNIQUE,
              [product_id] int NOT NULL,
              [qty] int NOT NULL,
              [date_start] datetime NOT NULL,
              [date_end] datetime NOT NULL,
              [status] nvarchar(10) NOT NULL,
              [created_at] datetime NOT NULL,
              [updated_at] datetime NOT NULL,
              PRIMARY KEY ([id])
              );
            
            ALTER TABLE [ProductionOrder] ADD CONSTRAINT [ProductionOrder_fk1] FOREIGN KEY ([product_id]) REFERENCES [Product]([id]);
            
            END;
          `;
      
          await createTable(pool, tableProdPO);
      
          const tableEmpPro = `
            IF OBJECT_ID('dbo.Employee', 'U') IS NULL
            BEGIN
            CREATE TABLE [dbo].[Employee] (
              [id] int NOT NULL UNIQUE,
              [name] nvarchar(255) NOT NULL,
              [NIK] int NOT NULL,
              [role] nvarchar(15) NOT NULL,
              [username] nvarchar(30) NOT NULL,
              [password] nvarchar(20) NOT NULL,
              [created_at] datetime NOT NULL,
              [updated_at] datetime NOT NULL,
              [flag] int NOT NULL,
              PRIMARY KEY ([id])
            );
            END;
            
            IF OBJECT_ID('dbo.Profile', 'U') IS NULL
              BEGIN
            CREATE TABLE [dbo].[Profile] (
              [id] int IDENTITY(1,1) NOT NULL UNIQUE,
              [id_employee] int NOT NULL,
              [plant] nvarchar(15) NOT NULL,
              [line] nvarchar(10) NOT NULL,
              [created_at] datetime NOT NULL,
              [updated_at] datetime NOT NULL,
              PRIMARY KEY ([id])
            );
            
            ALTER TABLE [Profile] ADD CONSTRAINT [Profile_fk1] FOREIGN KEY ([id_employee]) REFERENCES [Employee]([id]);
            
            END;
          `;
      
          await createTable(pool, tableEmpPro);

          const tableStopTrans = `
          IF OBJECT_ID('dbo.Stoppage', 'U') IS NULL
          BEGIN
          CREATE TABLE [dbo].[Stoppage] (
            [id] int IDENTITY(1,1) NOT NULL UNIQUE,
            [name] nvarchar(30) NOT NULL,
            [type] nvarchar(50) NOT NULL,
            PRIMARY KEY ([id])
          );
          
          END;
          
          IF OBJECT_ID('dbo.StoppageTransaction', 'U') IS NULL
            BEGIN
          CREATE TABLE [dbo].[StoppageTransaction] (
            [id] int NOT NULL UNIQUE,
            [stoppage_id] int NOT NULL,
            [date_start] datetime NOT NULL,
            [date_end] datetime NOT NULL,
            [remarks] nvarchar(50) NOT NULL,
            [created_at] datetime NOT NULL,
            [updated_at] datetime NOT NULL,
            PRIMARY KEY ([id])
          );
          
          ALTER TABLE [StoppageTransaction] ADD CONSTRAINT [StoppageTransaction_fk1] FOREIGN KEY ([stoppage_id]) REFERENCES [Stoppage]([id]);
          
          END;
        `;
    
        await createTable(pool, tableStopTrans);
      } catch (error) {
        console.error("Error creating tables:", error);
        throw error;
      }
    }
    
module.exports = { createTables };