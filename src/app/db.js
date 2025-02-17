const config = require("./db/config");
const sql = require("mssql");
const { createTables } = require('./app/addDb');
import URL from "./url";

(async () => await createTables(config))();

async function getProd(id) {
  try {
    let pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT sku FROM Product WHERE id = @id");
    return result.recordset;
  } catch (error) {
    console.log(error);
  }
}

async function getCatProd(cat) {
  try {
    const response = await fetch(`${URL}/getCatProd/${cat}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
      const data = await response.json();
      console.log(data);
      return data;
  } catch (error) {
    console.log(error);
  }
}

// async function updateProd(id, order) {
//   try {
//     let pool = await sql.connect(config);
//     const result = await pool
//       .request()
//       .input("id", sql.Int, id)
//       .input("name", order.name)
//       .input("category", order.category)
//       .input("volume", order.volume)
//       .input("created_at", order.created) 
//       .input("updated_at", order.updated)
//       .input("flag", order.flag).query(`UPDATE [dbo].[Product]
//                 SET [name] = @name,
//                     [category] = @category,
//                     [volume] = @volume,
//                     [created_at] = @created,
//                     [updatedAt] = GETDATE(),
//                     [flag] = @flag,
//                 WHERE id = @id`);
//     return result.rowsAffected;
//   } catch (err) {
//     console.log(err);
//   }
// }

// async function deleteProd(id) {
//   try {
//     let pool = await sql.connect(config);
//     const result = await pool
//       .request()
//       .input("id", sql.Int, id)
//       .query("UPDATE Product SET flag = 0 WHERE id = @id");
//     return result.rowsAffected;
//   } catch (error) {
//     console.log(error);
//   }
// }

async function createEmp(emp) {
  try {
    let pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("name", emp.name)
      .input("NIK", emp.NIK)
      .input("role", emp.role)
      .input("username", emp.username)
      .input("password", emp.password)
      .input("created_at", emp.created) 
      .input("updated_at", emp.updated)
      .input("flag", emp.flag)
      .query(`INSERT INTO [dbo].[Employee]
                ([name]
                ,[NIK]
                ,[role]
                ,[username]
                ,[password]
                ,[created_at]
                ,[updated_at]
                ,[flag])
                OUTPUT inserted.Id 
                VALUES
                (@name,
                  @NIK,
                  @role,
                  @username,
                  @password,
                  @created,
                  GETDATE(),
                  @flag,   
                  ); `);
    const product = prod;
    product.Id = result.recordset[0].Id;
    console.log("id data telah ditambahkan: ", product.Id);
    return product;
  } catch (err) {
    console.log(err);
  }
}

async function getEmp(username) {
  try {
    const response = await fetch(`${URL}/getEmp?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch employee data');
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function getAllEmp() {
  try {
    let pool = await sql.connect(config);
    const result = await pool
      .request()
      .query("SELECT * FROM Employee order by id desc");
    return result.recordset;
  } catch (error) {
    console.log(error);
  }
}

async function updateEmp(id, emp) {
  try {
    let pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", emp.name)
      .input("NIK", emp.NIK)
      .input("role", emp.role)
      .input("username", emp.username)
      .input("password", emp.password)
      .input("created_at", emp.created) 
      .input("updated_at", emp.updated)
      .input("flag", emp.flag).query(`UPDATE [dbo].[Employee]
                SET [name] = @name,
                    [NIK] = @NIK,
                    [role] = @role,
                    [username] = @username,
                    [password] = @password,
                    [created_at] = @created,
                    [updatedAt] = GETDATE(),
                WHERE id = @id`);
    return result.rowsAffected;
  } catch (err) {
    console.log(err);
  }
}

async function deleteEmp(id) {
  try {
    let pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("UPDATE Employee SET flag = 0 WHERE id = @id");
    return result.rowsAffected;
  } catch (error) {
    console.log(error);
  }
}

async function checkDraft(status) {
  try {
    let pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("status", sql.NVarChar, status)
      .query("SELECT * FROM ProductionOrder WHERE status = @status");
    return result.recordset;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  // createProd,
  createEmp,
  getProd,
  getCatProd, 
  getEmp, 
  // getAllProd,
  getAllEmp,  
  // updateProd, 
  updateEmp,
  // updatePO,  
  // deleteProd,
  deleteEmp, 
  checkDraft,
};
