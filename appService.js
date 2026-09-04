const oracledb = require("oracledb");
const loadEnvFile = require("./utils/envUtil");

const envVariables = loadEnvFile("./.env");

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
  user: envVariables.ORACLE_USER,
  password: envVariables.ORACLE_PASS,
  connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
  poolMin: 1,
  poolMax: 3,
  poolIncrement: 1,
  poolTimeout: 60,
};

// initialize connection pool
async function initializeConnectionPool() {
  try {
    await oracledb.createPool(dbConfig);
    console.log("Connection pool started");
  } catch (err) {
    console.error("Initialization error: " + err.message);
  }
}

async function closePoolAndExit() {
  console.log("\nTerminating");
  try {
    await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
    console.log("Pool closed");
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

initializeConnectionPool();

process.once("SIGTERM", closePoolAndExit).once("SIGINT", closePoolAndExit);

// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
  let connection;
  try {
    connection = await oracledb.getConnection(); // Gets a connection from the default pool
    return await action(connection);
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
  return await withOracleDB(async (connection) => {
    return true;
  }).catch(() => {
    return false;
  });
}

async function fetchRectableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `SELECT * FROM PlantingRecordTracks`,
    );
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function insertRectable(
  id,
  style,
  amount,
  plantDate,
  harvDate,
  bedID,
  plotID,
) {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `INSERT INTO PlantingRecordTracks (
            PlantingID, 
            PlantingStyle, 
            QuantityPlanted,
            PlantedDate,
            ExpectedHarvestDate, 
            BedID, 
            PlotID
            )
            VALUES (:id, :style, :amount, TO_DATE(:plantDate, 'YYYY-MM-DD'), 
            TO_DATE(:harvDate, 'YYYY-MM-DD'), :bedID, :plotID)`,
      [id, style, amount, plantDate, harvDate, bedID, plotID],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch((err) => {
    if (err.message.includes("ora-00001")) {
      if (err.message.includes("UNIQUE_BED")) {
        throw new Error(
          "This planting bed is already occupied, please consult the table of existing beds.",
        );
      } else throw new Error("A planting record with this ID already exists.");
    } else if (err.message.includes("ora-02291")) {
      throw new Error(
        "This planting bed does not exist, please consult the table of existing beds.",
      );
    }
    return false; // other errors
  });
}

//fetch AvBedTable FromDb
async function fetchAvBedTableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `SELECT BedID, PlotID, FertilizerType, Width, Length, Height
            FROM BedContains 
            WHERE (BedID, PlotID) NOT IN 
            (SELECT BedID, PlotID FROM PlantingRecordTracks)`,
    );
    return result.rows;
  }).catch(() => {
    return [];
  });
}

// select specific beds from db
async function selectBedsFromDb(operators, attributes, equatees) {
  const allowedOps = ["AND", "OR"];
  const allowedAtt = [
    "PlotID",
    "BedID",
    "FertilizerType",
    "Length",
    "Width",
    "Height",
  ];
  const opsList = listify(operators).filter((ops) => allowedOps.includes(ops));
  const attList = listify(attributes).filter((att) => allowedAtt.includes(att));
  const eqList = listify(equatees);

  const whereString = generateWhereString(opsList, attList, eqList);

  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `SELECT BedID, PlotID, FertilizerType, Length, Width, Height
            FROM BedContains
            ${whereString}`,
      eqList,
    );
    return result.rows;
  }).catch(() => {
    return [];
  });
}

// make there where string starting w/ the first (required) statement
// give an empty string when its provided with no clauses
function generateWhereString(ops, att, eq) {
  const stringList = [];
  if (att.length === 0) return "";

  stringList.push("WHERE", att[0], "=", ":0");
  if (att[0] != "FertilizerType") eq[0] = parseInt(eq[0], 10);

  if (ops.length != 0) {
    for (let i = 1; i < att.length; i++) {
      stringList.push(ops[i - 1], att[i], "=", `:${i}`);
      if (att[i] != "FertilizerType") eq[i] = parseInt(eq[i], 10);
    }
  }
  const string = stringList.join(" ");
  return string;
}

// turns the retrieved json paramters back into lists
function listify(param) {
  if (Array.isArray(param)) return param;
  else if (param) return [param];
  else return [];
}

async function projectScheduleFromDb(atrString) {
  const columns = ["ScheduleID", "Frequency", "StartTime", "Temp", "Amount"]; // making sure the user doesn't sneak anything in thru the url
  const sqlString = atrString
    .split(", ")
    .filter((atr) => columns.includes(atr));
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `SELECT ${sqlString}
            FROM WATERSCHEDULEFULL`,
    );
    return result.rows;
  }).catch(() => {
    return [];
  }); //!!!
}

// ToolShedLocatedAt Table Functions
// ToolShedLocatedAt (ShedID PK, LastCleanDate, Capacity, NumTools, ConditionLevel, PlotID), FK: (PlotID -> Plot(PlotID))
// ToolShedLocatedAt1 (LastCleanDate PK, ConditionLevel)
// ToolShedLocatedAt2 (ShedID PK, LastCleanDate, Capacity, NumTools, PlotID), FK: (PlotID -> Plot(PlotID)), (LastCleanDate -> ToolShedLocatedAt1(LastCleanDate))

// fetch ToolShedLocatedAt Table, which is decomposed into ToolShedLocatedAt1 and ToolShedLocatedAt2
async function fetchToolShedLocatedAtTableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`
            SELECT *
            FROM ToolShedLocatedAtFull`);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

//fetches available plots in Plot, where ToolShed and Plot are in 1-to-1 + participation constraint
async function fetchAvPlotTableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `SELECT *
       FROM Plot 
       WHERE PlotID NOT IN 
            (SELECT PlotID FROM ToolShedLocatedAt2)`,
    );
    return result.rows;
  }).catch(() => {
    return [];
  });
}

// function to update Capacity in ToolShedLocatedAt2 table
async function updateCapacityToolShedLocatedAtTable(toolShedID, newCapacity) {
  return await withOracleDB(async (connection) => {
    const count = await connection.execute(
      `SELECT COUNT(*)
            FROM ToolShedLocatedAt2
            WHERE ShedID=:toolShedID`,
      [toolShedID],
    );

    if (count.rows[0][0] == 0) {
      throw new Error(
        "This shedID does not exist, please consult the table for existing shedIDs.",
      );
    }

    const result = await connection.execute(
      `UPDATE ToolShedLocatedAt2
            SET Capacity=:newCapacity
            WHERE ShedID =:toolShedID`,
      [newCapacity, toolShedID],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch((err) => {
    if (err.message ==
      "This shedID does not exist, please consult the table for existing shedIDs.") {
      throw err;
    }
    
    return false;
  });
}

// function to update NumTools in ToolShedLocatedAt2 table
async function updateNumToolsToolShedLocatedAtTable(toolShedID, newNumTools) {
  return await withOracleDB(async (connection) => {
    const count = await connection.execute(
      `SELECT COUNT(*)
            FROM ToolShedLocatedAt2
            WHERE ShedID=:toolShedID`,
      [toolShedID],
    );

    if (count.rows[0][0] == 0) {
      throw new Error(
        "This shedID does not exist, please consult the table for existing shedIDs.",
      );
    }

    const result = await connection.execute(
      `UPDATE ToolShedLocatedAt2
            SET NumTools=:newNumTools
            WHERE ShedID =:toolShedID`,
      [newNumTools, toolShedID],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch((err) => {
    if (err.message ==
      "This shedID does not exist, please consult the table for existing shedIDs.") {
      throw err;
    }

    return false;
  });
}

// function to update ConditionLevel in ToolShedLocatedAt1 table, handles OldConditionLevel NULL case
async function updateConditionLevelToolShedLocatedAtTable(
  toolShedID,
  NewConditionLevel,
) {
  return await withOracleDB(async (connection) => {
    const count = await connection.execute(
      `SELECT COUNT(*)
            FROM ToolShedLocatedAt2
            WHERE ShedID=:toolShedID`,
      [toolShedID],
    );

    if (count.rows[0][0] == 0) {
      throw new Error(
        "This shedID does not exist, please consult the table for existing shedIDs.",
      );
    }

    const result = await connection.execute(
      `UPDATE ToolShedLocatedAt1
              SET ConditionLevel=:NewConditionLevel
              WHERE LastCleanDate = (SELECT LastCleanDate
              FROM ToolShedLocatedAt2
              WHERE ShedID =:toolShedID)`,
      [NewConditionLevel, toolShedID],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch((err) => {
    if (err.message ==
      "This shedID does not exist, please consult the table for existing shedIDs.") {
      throw err;
    }

    return false;
  });
}

// function to update PlotID in ToolShedLocatedAt2 table,
async function updatePlotIDToolShedLocatedAtTable(toolShedID, NewPlotID) {
  return await withOracleDB(async (connection) => {
    const count = await connection.execute(
      `SELECT COUNT(*)
            FROM ToolShedLocatedAt2
            WHERE ShedID=:toolShedID`,
      [toolShedID],
    );

    if (count.rows[0][0] == 0) {
      throw new Error(
        "This shedID does not exist, please consult the table for existing shedIDs.",
      );
    }

    const result = await connection.execute(
      `UPDATE ToolShedLocatedAt2
            SET PlotID=:NewPlotID
            WHERE ShedID=:toolShedID`,
      [NewPlotID, toolShedID],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch((err) => {
    if (err.message ==
      "This shedID does not exist, please consult the table for existing shedIDs.") {
      throw err;
    } else if (err.errorNum == 1) {
      throw new Error(
        "This PlotID is already occupied, please consult the table of existing PlotIDs.",
      );
    }

    return false;
  });
}

async function sumHarvestTableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`
            SELECT h.HarvestDate, Sum(h.Value)
            FROM HarvestYieldsFull h
            GROUP BY HarvestDate
        `);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function joinHarvestYieldsAndCropGivenCropName(cropName) {
  return await withOracleDB(async (connection) => {
    const count = await connection.execute(
      `SELECT COUNT(*)
            FROM Crop1
            WHERE CropName=:cropName`,
      [cropName],
    );

    if (count.rows[0][0] == 0) {
      throw new Error(
        "This cropName does not exist, please consult the table for existing cropNames.",
      );
    }

    const result = await connection.execute(
      `SELECT h.HarvestDate, h.Weight, h.Value, c.CropName
            FROM HARVESTYIELDSFULL h
            JOIN Crop1 c ON c.Species = h.Species
            WHERE c.CropName =:cropName`,
      [cropName],
    );

    if (result.rows.length == 0) {
      throw new Error("This cropName did not have any harvests.");
    }

    return result.rows;
  }).catch((err) => {
    if (
      err.message ==
      "This cropName does not exist, please consult the table for existing cropNames."
    ) {
      throw err;
    } else if (err.message == "This cropName did not have any harvests.") {
      throw err;
    }

    return [];
  });
}

async function fetchCropTableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`
            SELECT *
            FROM CROPFULL`);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function gardenersMoreThanOnePlotTableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`
            SELECT g.GardenerID, g.FirstName, g.Email, g.ResidenceUnitNum, Count(r.PlotID) AS NumOfPlots
            FROM GardenerFull g
            JOIN Rents r ON g.GardenerID = r.GardenerID
            GROUP BY g.GardenerID, g.FirstName, g.Email, g.ResidenceUnitNum
            HAVING Count(r.PlotID) >= 2
        `);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function lowestAvgEquipmentConditionByShedTableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`
            SELECT s1.ShedID, s1.EquipmentType, AVG(s1.ConditionLevel) AS avgConditionLevel
            FROM StoresAndCheckedOutEquipmentFull s1
            GROUP BY s1.ShedID, s1.EquipmentType
            HAVING AVG (s1.ConditionLevel) <= (Select AVG (s2.ConditionLevel)
                                               FROM StoresAndCheckedOutEquipmentFull s2
                                               WHERE s1.EquipmentType = s2.EquipmentType
                                               GROUP BY s2.EquipmentType)
            ORDER BY ShedID ASC, EquipmentType ASC
        `);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

// !!!
// ----------------------------------------------------------
// Gardener table functions
// Gardener2 (Email PK, LastName)
// Gardener3 (Email PK/FK -> Gardener2, FirstName)
// Gardener4 (GardenerID PK, Email UNIQUE PK/FK -> Gardener2, ResidenceUnitNum)

async function fetchGardenerFromDb() {
  return await withOracleDB(async (connection) => {
    // Join three tables with email
    const result = await connection.execute(`SELECT * FROM GardenerFULL`);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function insertGardener(
  firstName,
  lastName,
  residenceUnitNum,
  gardenerID,
  email,
) {
  return await withOracleDB(async (connection) => {
    try {
      try {
        await connection.execute(
          `INSERT INTO GARDENER2 (LastName, Email) VALUES (:lastName, :email)`,
          [lastName, email],
          { autoCommit: false },
        );
      } catch (err) {
        if (err.errorNum == 1) {
          throw new Error(
            "This email is already taken, please consult the table for existing emails.",
          );
        }

        throw err;
      }

      try {
        await connection.execute(
          `INSERT INTO GARDENER3 (FirstName, Email) VALUES (:firstName, :email)`,
          [firstName, email],
          { autoCommit: false },
        );
      } catch (err) {
        if (err.errorNum == 1) {
          throw new Error(
            "This email is already taken, please consult the table for existing emails.",
          );
        }

        throw err;
      }

      let result;
      try {
        result = await connection.execute(
          `INSERT INTO GARDENER4 (ResidenceUnitNum, GardenerID, Email) VALUES (:residenceUnitNum, :gardenerID, :email)`,
          [residenceUnitNum, gardenerID, email],
          { autoCommit: false },
        );
      } catch (err) {
        if (err.errorNum == 1) {
          throw new Error(
            "This GardenerID is already exists, please consult the table for existing GardenerIDs.",
          );
        }

        throw err;
      }

      await connection.commit();
      return result.rowsAffected && result.rowsAffected > 0;
    } catch (err) {
      await connection.rollback();
      if (
        err.message ==
        "This email is already taken, please consult the table for existing emails."
      ) {
        throw err;
      } else if (
        err.message ==
        "This GardenerID is already exists, please consult the table for existing GardenerIDs."
      ) {
        throw err;
      }

      return false;
    }
  });
}

// Allow user to update Gardener first/last name or residence unit number
async function updateGardener(
  firstName,
  lastName,
  residenceUnitNum,
  gardenerID,
) {
  return await withOracleDB(async (connection) => {
    try {
      const emailResult = await connection.execute(
        `SELECT Email FROM GARDENER4 WHERE GardenerID = :gardenerID`,
        [gardenerID],
      );

      if (emailResult.rows.length === 0) {
        // nothing to update
        return false;
      }
      const email = emailResult.rows[0][0];

      // update parent before children
      await connection.execute(
        `UPDATE GARDENER2 SET LastName = :lastName WHERE Email = :email`,
        [lastName, email],
        { autoCommit: false },
      );

      await connection.execute(
        `UPDATE GARDENER3 SET FirstName = :firstName WHERE Email = :email`,
        [firstName, email],
        { autoCommit: false },
      );

      await connection.execute(
        `UPDATE GARDENER4 SET ResidenceUnitNum = :residenceUnitNum WHERE GardenerID = :gardenerID`,
        [residenceUnitNum, gardenerID],
        { autoCommit: false },
      );

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    }
  }).catch(() => {
    return false;
  });
}

async function deleteGardener(gardenerID) {
  return await withOracleDB(async (connection) => {
    try {
      const emailResult = await connection.execute(
        `SELECT Email FROM GARDENER4 WHERE GardenerID = :gardenerID`,
        [gardenerID],
      );

      if (emailResult.rows.length === 0) {
        // nothing to delete
        return false;
      }
      const email = emailResult.rows[0][0];

      // get rented plots by deleted gardener
      const rentedPlots = await connection.execute(
        `SELECT PlotID FROM RENTS WHERE GardenerID = :gardenerID`,
        [gardenerID],
      );

      // delete children before parent
      const result = await connection.execute(
        `DELETE FROM GARDENER4 WHERE GardenerID = :gardenerID`,
        [gardenerID],
        { autoCommit: false },
      );

      await connection.execute(
        `DELETE FROM GARDENER3 WHERE Email = :email`,
        [email],
        { autoCommit: false },
      );

      await connection.execute(
        `DELETE FROM GARDENER2 WHERE Email = :email`,
        [email],
        { autoCommit: false },
      );

      // umark availability of plots rented by deleted gardener
      for (const [plotID] of rentedPlots.rows) {
        await connection.execute(
          `UPDATE PLOT SET IsAvailable = 1 WHERE PlotID = :plotID`,
          [plotID],
          { autoCommit: false },
        );
      }

      await connection.commit();
      return result.rowsAffected && result.rowsAffected > 0;
    } catch (err) {
      await connection.rollback();
      throw err;
    }
  }).catch(() => {
    return false;
  });
}

// Division query
// Find gardeners that are renting all indoor/outdoor plots
async function fetchGardenerRentingAllPlotsOfType(isIndoor) {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `SELECT g4.gardenerid, g3.firstname, g2.lastname
      FROM GARDENER4 g4
      JOIN GARDENER2 g2 ON g4.email = g2.email
      JOIN GARDENER3 g3 ON g4.email = g3.email
      WHERE g4.gardenerid IN (
        SELECT r1.gardenerid
        FROM RENTS r1
        WHERE NOT EXISTS (
          (SELECT plotid FROM PLOT WHERE isindoor = :isindoor)
          MINUS
          (SELECT r2.plotid FROM RENTS r2 WHERE r2.gardenerid = r1.gardenerid)
          )
        )
        ORDER BY g4.gardenerid`,
      [isIndoor],
    );
    return result.rows;
  }).catch(() => {
    return [];
  });
}
// ----------------------------------------------------------
// Plot table functions
// Plot (PlotSize, IsAvailable, PlotID PK, IsIndoor)

async function fetchPlotFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(` SELECT * FROM PLOT `);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function insertPlot(plotSize, isAvailable, plotId, isIndoor) {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `INSERT INTO PLOT (Plotsize, IsAvailable, PlotId, IsIndoor) VALUES (:plotsize, :isavailable, :plotid, :isindoor)`,
      [plotSize, isAvailable ? 1 : 0, plotId, isIndoor ? 1 : 0],
      { autoCommit: true },
    );
    return result.rowsAffected && result.rowsAffected > 0;
  }).catch((err) => {
    if (err.message.includes("ora-00001")) {
      throw new Error("A plot with this ID already exists.");
    } else return false; // other errors
  });
}

// ----------------------------------------------------------
// Equipment table functions
// StoresAndCheckedOutEquipment1 (PurchaseDate PK, ConditionLevel)
// StoresAndCheckedOutEquipment2 (EquipmentID PK,
// PurchaseDate FK -> StoresAndCheckedOutEquipment1, EquipmentType, GardenerID FK -> Gardener4)
// TODO: ShedID once shed is merged
//
// Equipment is partial and disjoint
const EQUIPMENT_TYPES = ["GARDENHOE", "WATERINGCAN", "SHOVEL", "PRUNER"];

async function fetchEquipmentFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`
      SELECT ef.equipmentid, ef.purchasedate, ef.equipmenttype, ef.shedid, ef.conditionlevel, ef.gardenerid,
      gh.plotstilled, gh.toolsize, gh.datelastsharpened,
      wc.maxvolume, wc.spout, wc.material,
      sv.manufacturer, sv.shape, sv.length,
      pr.manufacturer, pr.toolsize AS prtoolsize, pr.type
      FROM STORESANDCHECKEDOUTEQUIPMENTFULL ef
      LEFT JOIN GARDENHOE gh ON ef.equipmentid = gh.equipmentid
      LEFT JOIN WATERINGCAN wc ON ef.equipmentid = wc.equipmentid
      LEFT JOIN SHOVEL sv ON ef.equipmentid = sv.equipmentid
      LEFT JOIN PRUNER pr ON ef.equipmentid = pr.equipmentid
      ORDER BY ef.equipmentid
      `);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function insertEquipment(
  equipmentId,
  purchaseDate,
  equipmentType,
  shedId,
  conditionLevel,
  gardenerId,
  equipmentName,
  typeAttributes = {},
) {
  if (!equipmentName) return false;
  const specifiedType = equipmentName.toUpperCase();

  // convert date objects
  const purchaseDateObj = new Date(purchaseDate);
  const dateLastSharpenedObj = typeAttributes.dateLastSharpened
    ? new Date(typeAttributes.dateLastSharpened)
    : null;

  return await withOracleDB(async (connection) => {
    try {
      const dateResult = await connection.execute(
        `SELECT purchasedate FROM STORESANDCHECKEDOUTEQUIPMENT1 WHERE purchasedate = :purchase_date`,
        [purchaseDateObj],
      );

      // skip insert in equipment1 if purchase date already exists (insert in equipment 2 either way)
      if (dateResult.rows.length === 0) {
        await connection.execute(
          `INSERT INTO STORESANDCHECKEDOUTEQUIPMENT1 (purchasedate, conditionlevel)
          VALUES (:purchase_date, :condition_level)`,
          [purchaseDateObj, conditionLevel],
          { autoCommit: false },
        );
      }

      const result = await connection.execute(
        `INSERT INTO STORESANDCHECKEDOUTEQUIPMENT2 (equipmentid, purchasedate, equipmenttype, shedid, gardenerid)
        VALUES (:equipment_id, :purchase_date, :equipment_type, :shed_id, :gardener_id)`,
        [equipmentId, purchaseDateObj, equipmentType, shedId, gardenerId],
        { autoCommit: false },
      );

      // enforce disjoint ISA and allow partial
      if (EQUIPMENT_TYPES.includes(specifiedType)) {
        // insert into corresponding sublass
        switch (specifiedType) {
          case "GARDENHOE":
            await connection.execute(
              `INSERT INTO GARDENHOE (equipmentid, plotstilled, toolsize, datelastsharpened)
            VALUES (:equipment_id, :plots_tilled, :tool_size, :date_last_sharpened)`,
              [
                equipmentId,
                typeAttributes.plotsTilled,
                typeAttributes.toolSize,
                dateLastSharpenedObj,
              ],
              { autoCommit: false },
            );
            break;
          case "WATERINGCAN":
            await connection.execute(
              `INSERT INTO WATERINGCAN (equipmentid, maxvolume, spout, material)
            VALUES (:equipment_id, :max_volume, :spout, :material)`,
              [
                equipmentId,
                typeAttributes.maxVolume,
                typeAttributes.spout,
                typeAttributes.material,
              ],
              { autoCommit: false },
            );
            break;
          case "SHOVEL":
            await connection.execute(
              `INSERT INTO SHOVEL (equipmentid, manufacturer, shape, length)
            VALUES (:equipment_id, :manufacturer, :shape, :length)`,
              [
                equipmentId,
                typeAttributes.manufacturer,
                typeAttributes.shape,
                typeAttributes.shaftLength,
              ],
              { autoCommit: false },
            );
            break;
          case "PRUNER":
            await connection.execute(
              `INSERT INTO PRUNER (equipmentid, manufacturer, toolsize, type)
            VALUES (:equipment_id, :manufacturer, :tool_size, :type)`,
              [
                equipmentId,
                typeAttributes.manufacturer,
                typeAttributes.toolSize,
                typeAttributes.type,
              ],
              { autoCommit: false },
            );
            break;
        }
      }

      await connection.commit();
      return result.rowsAffected && result.rowsAffected > 0;
    } catch (err) {
      await connection.rollback();
      throw err;
    }
  }).catch(() => {
    return false;
  });
}

async function deleteEquipment(equipmentId) {
  return await withOracleDB(async (connection) => {
    try {
      const dateResult = await connection.execute(
        `SELECT purchasedate FROM STORESANDCHECKEDOUTEQUIPMENT2 WHERE equipmentid = :equipment_id`,
        [equipmentId],
      );

      // nothing to delete
      if (dateResult.rows.length === 0) {
        return false;
      }

      const purchaseDate = dateResult.rows[0][0];

      const result = await connection.execute(
        `DELETE FROM STORESANDCHECKEDOUTEQUIPMENT2 WHERE equipmentid = :equipment_id`,
        [equipmentId],
        { autoCommit: false },
      );

      const remaining = await connection.execute(
        `SELECT COUNT(*) FROM STORESANDCHECKEDOUTEQUIPMENT2 WHERE purchasedate = :purchase_date`,
        [purchaseDate],
      );

      // only delete from equipment1 if no more tools depend on it
      if (remaining.rows[0][0] === 0) {
        await connection.execute(
          `DELETE FROM STORESANDCHECKEDOUTEQUIPMENT1 WHERE purchasedate = :purchase_date`,
          [purchaseDate],
          { autoCommit: false },
        );
      }

      await connection.commit();
      return result.rowsAffected && result.rowsAffected > 0;
    } catch (err) {
      await connection.rollback();
      throw err;
    }
  }).catch(() => {
    return false;
  });
}

// equipment checkout/return
async function checkoutEquipment(gardenerId, equipmentId) {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `UPDATE STORESANDCHECKEDOUTEQUIPMENT2
      SET gardenerid = :gardener_id
      WHERE gardenerid IS NULL AND equipmentid = :equipment_id`,
      [gardenerId, equipmentId],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch(() => {
    return false;
  });
}

async function returnEquipment(gardenerId, equipmentId) {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `UPDATE STORESANDCHECKEDOUTEQUIPMENT2
      SET gardenerid = NULL
      WHERE gardenerid = :gardener_id AND equipmentid = :equipment_id`,
      [gardenerId, equipmentId],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch(() => {
    return false;
  });
}

// ----------------------------------------------------------
// Rents table functions
// Gardener -- Rents -- Plot
async function fetchRentsFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(`
        SELECT g.GardenerID, g.FirstName, g.LastName, r.PlotID
        FROM RENTS r
        JOIN GARDENERFULL g ON r.GardenerID = g.GardenerID
        ORDER BY g.GardenerID, r.PlotID
      `);
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function rentPlot(gardenerID, plotID) {
  return await withOracleDB(async (connection) => {
    try {
      const availabilityResult = await connection.execute(
        `SELECT IsAvailable FROM PLOT WHERE PlotID = :plotID`,
        [plotID],
      );

      if (
        availabilityResult.rows.length == 0 ||
        availabilityResult.rows[0][0] == 0
      ) {
        // plot doesn't exist or is not available
        return false;
      }

      await connection.execute(
        `INSERT INTO RENTS (GardenerID, PlotID) VALUES (:GardenerID, :plotID)`,
        [gardenerID, plotID],
        { autoCommit: false },
      );

      // mark plot unavailable
      await connection.execute(
        `UPDATE PLOT SET IsAvailable = 0 WHERE PlotID = :plotID`,
        [plotID],
        { autoCommit: false },
      );

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    }
  }).catch(() => {
    return false;
  });
}

async function returnPlot(gardenerID, plotID) {
  return await withOracleDB(async (connection) => {
    try {
      const deleteResult = await connection.execute(
        `DELETE FROM RENTS WHERE GardenerID = :gardenerID AND PlotID = :plotID`,
        [gardenerID, plotID],
        { autoCommit: false },
      );

      if (!deleteResult.rowsAffected) {
        // gardener didn't hold that plot
        await connection.rollback();
        return false;
      }

      await connection.execute(
        `UPDATE PLOT SET IsAvailable = 1 WHERE PlotID = :plotID`,
        [plotID],
        { autoCommit: false },
      );

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      return false;
    }
  }).catch(() => {
    return false;
  });
}

module.exports = {
  testOracleConnection,
  fetchRectableFromDb,
  insertRectable,
  fetchAvBedTableFromDb,
  selectBedsFromDb,
  fetchToolShedLocatedAtTableFromDb,
  fetchAvPlotTableFromDb,
  updateCapacityToolShedLocatedAtTable,
  updateNumToolsToolShedLocatedAtTable,
  updateConditionLevelToolShedLocatedAtTable,
  updatePlotIDToolShedLocatedAtTable,
  sumHarvestTableFromDb,
  projectScheduleFromDb,
  joinHarvestYieldsAndCropGivenCropName,
  fetchCropTableFromDb,
  gardenersMoreThanOnePlotTableFromDb,

  // nested aggregation with group by, average condition level per equipment type in each shed table,
  // where they are the lowest compared to overall average condition level for that equipment type
  lowestAvgEquipmentConditionByShedTableFromDb,

  //gardener
  fetchGardenerFromDb,
  insertGardener,
  updateGardener,
  deleteGardener,
  fetchGardenerRentingAllPlotsOfType,

  //plot
  fetchPlotFromDb,
  insertPlot,

  // equipment
  fetchEquipmentFromDb,
  insertEquipment,
  deleteEquipment,
  checkoutEquipment,
  returnEquipment,

  //Rents
  fetchRentsFromDb,
  rentPlot,
  returnPlot,
};
