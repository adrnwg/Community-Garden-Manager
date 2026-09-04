const express = require("express");
const appService = require("./appService");

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get("/check-db-connection", async (req, res) => {
  const isConnect = await appService.testOracleConnection();
  if (isConnect) {
    res.send("connected");
  } else {
    res.send("unable to connect");
  }
});

router.get("/rectable", async (req, res) => {
  const tableContent = await appService.fetchRectableFromDb();
  res.json({ data: tableContent });
});

router.post("/insert-rectable", async (req, res) => {
  const { id, style, amount, plantDate, harvDate, bedID, plotID } = req.body;
  try {
    const insertResult = await appService.insertRectable(
      id,
      style,
      amount,
      plantDate,
      harvDate,
      bedID,
      plotID,
    );
    if (insertResult) {
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json({ success: false, errMessage: "Error inserting data!" }); // other errors
    }
  } catch (error) {
    res.status(400).json({ success: false, errMessage: error.message }); //user error
  }
});

router.get("/avBedtable", async (req, res) => {
  const tableContent = await appService.fetchAvBedTableFromDb();
  res.json({ data: tableContent });
});

router.get("/selectBeds", async (req, res) => {
  const tableContent = await appService.selectBedsFromDb(
    req.query.operators,
    req.query.attributes,
    req.query.equatees,
  );
  res.json({ data: tableContent });
});

router.get("/toolshedlocatedattable", async (req, res) => {
  const tableContent = await appService.fetchToolShedLocatedAtTableFromDb();
  res.json({ data: tableContent });
});

router.get("/avplottable", async (req, res) => {
  const tableContent = await appService.fetchAvPlotTableFromDb();
  res.json({ data: tableContent });
});

router.post("/update-capacity-toolshedlocatedattable", async (req, res) => {
  const { toolShedID, newCapacity } = req.body;
  try {
    const updateResult = await appService.updateCapacityToolShedLocatedAtTable(
      toolShedID,
      newCapacity,
    );
    if (updateResult) {
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json({ success: false, errMessage: "Error updating Capacity!" }); // other errors
    }
  } catch (err) {
    res.status(400).json({ success: false, errMessage: err.message }); //user error
  }
});

router.post("/update-numtools-toolshedlocatedattable", async (req, res) => {
  const { toolShedID, newNumTools } = req.body;
  try {
    const updateResult = await appService.updateNumToolsToolShedLocatedAtTable(
      toolShedID,
      newNumTools,
    );
    if (updateResult) {
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json({ success: false, errMessage: "Error updating NumTools!" }); // other errors
    }
  } catch (err) {
    res.status(400).json({ success: false, errMessage: err.message }); //user error
  }
});

router.post(
  "/update-conditionlevel-toolshedlocatedattable",
  async (req, res) => {
    const { toolShedID, NewConditionLevel } = req.body;
    try {
      const updateResult =
        await appService.updateConditionLevelToolShedLocatedAtTable(
          toolShedID,
          NewConditionLevel,
        );
      if (updateResult) {
        res.json({ success: true });
      } else {
        res
          .status(500)
          .json({
            success: false,
            errMessage: "Error updating ConditionLevel!",
          }); // other errors
      }
    } catch (err) {
      res.status(400).json({ success: false, errMessage: err.message }); //user error
    }
  },
);

router.post("/update-plotid-toolshedlocatedattable", async (req, res) => {
  const { toolShedID, NewPlotID } = req.body;
  try {
    const updateResult = await appService.updatePlotIDToolShedLocatedAtTable(
      toolShedID,
      NewPlotID,
    );
    if (updateResult) {
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json({ success: false, errMessage: "Error updating PlotID!" }); // other errors
    }
  } catch (err) {
    res.status(400).json({ success: false, errMessage: err.message }); //user error
  }
});

router.get("/sum-harvests", async (req, res) => {
  const tableContent = await appService.sumHarvestTableFromDb();
  res.json({ data: tableContent });
});

router.get(`/projectSchedule`, async (req, res) => {
  const sqlString = req.query.string;
  const projectResult = await appService.projectScheduleFromDb(sqlString);
  res.json({ data: projectResult });
});

router.post("/joinharvestyieldsandcrop", async (req, res) => {
  const { cropName } = req.body;

  try {
    const joinResult =
      await appService.joinHarvestYieldsAndCropGivenCropName(cropName);
    if (joinResult) {
      res.json({ success: true, data: joinResult });
    } else {
      res
        .status(500)
        .json({
          success: false,
          errMessage: "Error joining HarvestYields and Crop!",
        }); // other errors
    }
  } catch (err) {
    res.status(400).json({ success: false, errMessage: err.message }); //user error
  }
});

router.get("/croptable", async (req, res) => {
  const tableContent = await appService.fetchCropTableFromDb();
  res.json({ data: tableContent });
});

router.get("/gardenersmorethanoneplottable", async (req, res) => {
  const tableContent = await appService.gardenersMoreThanOnePlotTableFromDb();
  res.json({ data: tableContent });
});

router.get("/lowestavgequipmentconditionbyshedtable", async (req, res) => {
  const tableContent =
    await appService.lowestAvgEquipmentConditionByShedTableFromDb();
  res.json({ data: tableContent });
});

// !!!
// ----------------------------------------------------------
// GARDENER endpoints

router.get("/gardener", async (req, res) => {
  const gardenerContent = await appService.fetchGardenerFromDb();
  res.json({ data: gardenerContent });
});

router.post("/insert-gardener", async (req, res) => {
  const { firstName, lastName, residenceUnitNum, gardenerID, email } = req.body;
  try {
    const insertResult = await appService.insertGardener(
      firstName,
      lastName,
      residenceUnitNum,
      gardenerID,
      email,
    );

    if (insertResult) {
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json({ success: false, errMessage: "Error inserting data!" });
    }
  } catch (err) {
    res.status(400).json({ success: false, errMessage: err.message }); //user error
  }
});

router.put("/update-gardener", async (req, res) => {
  const { firstName, lastName, residenceUnitNum, gardenerID } = req.body;
  const updateResult = await appService.updateGardener(
    firstName,
    lastName,
    residenceUnitNum,
    gardenerID,
  );

  if (updateResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.delete("/delete-gardener", async (req, res) => {
  const { gardenerID } = req.body;
  const deleteResult = await appService.deleteGardener(gardenerID);

  if (deleteResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.get("/gardener-renting-all-plots-of-type", async (req, res) => {
  const { isIndoor } = req.query;
  const result = await appService.fetchGardenerRentingAllPlotsOfType(
    Number(isIndoor),
  );
  res.json({ data: result });
});

// ----------------------------------------------------------
// PLOT endpoints

router.get("/plot", async (req, res) => {
  const plotContent = await appService.fetchPlotFromDb();
  res.json({ data: plotContent });
});

router.post("/insert-plot", async (req, res) => {
  const { plotSize, isAvailable, plotId, isIndoor } = req.body;
  try {
    const insertResult = await appService.insertPlot(
      plotSize,
      isAvailable,
      Number(plotId),
      isIndoor,
    );
    if (insertResult) {
      res.json({ success: true });
    } else {
      res
        .status(500)
        .json({ success: false, errMessage: "Error inserting data!" }); // other errors
    }
  } catch (error) {
    res.status(400).json({ success: false, errMessage: error.message }); //user error
  }
});

router.post("/rent-plot", async (req, res) => {
  const { gardenerID, plotID } = req.body;
  const rentResult = await appService.rentPlot(gardenerID, plotID);

  if (rentResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.delete("/return-plot", async (req, res) => {
  const { gardenerID, plotID } = req.body;
  const returnResult = await appService.returnPlot(gardenerID, plotID);

  if (returnResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

// ----------------------------------------------------------
// EQUIPMENT endpoints

router.get("/equipment", async (req, res) => {
  const equipmentContent = await appService.fetchEquipmentFromDb();
  res.json({ data: equipmentContent });
});

router.post("/insert-equipment", async (req, res) => {
  const {
    equipmentId,
    purchaseDate,
    equipmentType,
    shedId,
    conditionLevel,
    gardenerId,
    equipmentName,
    typeAttributes,
  } = req.body;
  // ensure empty optional fields are set to null
  const insertResult = await appService.insertEquipment(
    Number(equipmentId),
    purchaseDate,
    equipmentType,
    shedId !== "" ? Number(shedId) : null,
    conditionLevel !== "" ? Number(conditionLevel) : null,
    gardenerId !== "" ? Number(gardenerId) : null,
    equipmentName,
    typeAttributes || {},
  );

  if (insertResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.delete("/delete-equipment", async (req, res) => {
  const { equipmentId } = req.body;
  const deleteResult = await appService.deleteEquipment(Number(equipmentId));

  if (deleteResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.post("/checkout-equipment", async (req, res) => {
  const { gardenerId, equipmentId } = req.body;
  const checkoutResult = await appService.checkoutEquipment(
    Number(gardenerId),
    Number(equipmentId),
  );

  if (checkoutResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.delete("/return-equipment", async (req, res) => {
  const { gardenerId, equipmentId } = req.body;
  const returnResult = await appService.returnEquipment(
    Number(gardenerId),
    Number(equipmentId),
  );

  if (returnResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

// ----------------------------------------------------------
// RENTS endpoints (Gardener -- Rents -- Plot)
router.get("/rents", async (req, res) => {
  const rentsContent = await appService.fetchRentsFromDb();
  res.json({ data: rentsContent });
});

module.exports = router;
