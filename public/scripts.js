/*
 * These functions below are for various webpage functionalities.
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 *
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your
 *   backend endpoints
 * and
 *   HTML structure.
 *
 */

// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
  const statusElem = document.getElementById("dbStatus");
  const loadingGifElem = document.getElementById("loadingGif");

  const response = await fetch("/check-db-connection", {
    method: "GET",
  });

  // Hide the loading GIF once the response is received.
  loadingGifElem.style.display = "none";
  // Display the statusElem's text in the placeholder.
  statusElem.style.display = "inline";

  response
    .text()
    .then((text) => {
      statusElem.textContent = text;
    })
    .catch((error) => {
      statusElem.textContent = "connection timed out"; // Adjust error handling if required.
    });
}

// Fetches data from the PlantingRecords table and displays it.
async function fetchAndDisplayPlantRec() {
  const tableElement = document.getElementById("recTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/rectable", {
    method: "GET",
  });

  const responseData = await response.json();
  const plantRecTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  plantRecTableContent.forEach((rec) => {
    const row = tableBody.insertRow();
    rec.forEach((field, index) => {
      const cell = row.insertCell(index);
      if (index == 3 || index == 4)
        cell.textContent = new Date(field).toLocaleDateString();
      else cell.textContent = field;
    });
  });
}

// Inserts new planting record.
async function insertPlantRec(event) {
  event.preventDefault();

  const id = document.getElementById("plantRecId").value;
  const style = document.getElementById("plantStyle").value;
  const amount = document.getElementById("plantRecAmount").value;
  const plantDate = document.getElementById("plantRecDate").value;
  const harvDate = document.getElementById("recHarvDate").value;
  const bedID = document.getElementById("recFkBed").value;
  const plotID = document.getElementById("recFkPlot").value;

  const response = await fetch("/insert-rectable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      style,
      amount,
      plantDate,
      harvDate,
      bedID,
      plotID,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("insertPlantRecResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Data inserted successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

// Fetches & displays available beds.
async function fetchAndDisplayAvailableBeds() {
  const tableElement = document.getElementById("availableBeds");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/avBedtable", {
    method: "GET",
  });

  const responseData = await response.json();
  const avBedTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  avBedTableContent.forEach((rec) => {
    const row = tableBody.insertRow();
    rec.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

// Fetch & display beds according to constraints made by user
async function selectBeds(event) {
  event.preventDefault();
  const tableElement = document.getElementById("bedTable");
  const tableBody = tableElement.querySelector("tbody");
  const messageElement = document.getElementById("bedSearchResultMsg");

  const queries = new URLSearchParams();
  try {
    const clauses = getBedClauses();
    clauses.attributes.forEach((a) => queries.append("attributes", a));
    clauses.operators.forEach((o) => queries.append("operators", o));
    clauses.equatees.forEach((e) => queries.append("equatees", e));
  } catch (err) {
    if (err.message === "Input left blank!")
      messageElement.textContent = err.message;
    return;
  }
  const response = await fetch(`/selectBeds?${queries.toString()}`, {
    method: "GET",
  });

  const responseData = await response.json();
  const bedContent = responseData.data;

  if (tableBody) tableBody.innerHTML = "";

  bedContent.forEach((bed) => {
    const row = tableBody.insertRow();
    bed.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });

  if (bedContent.length === 0) {
    messageElement.textContent = "This search yielded no results.";
  } else if (bedContent.length == 1)
    messageElement.textContent = "1 bed found!";
  else messageElement.textContent = `${bedContent.length} beds found!`;
}

function addClause() {
  const attributes = [
    "PlotID",
    "BedID",
    "FertilizerType",
    "Length",
    "Width",
    "Height",
  ];
  const operators = ["AND", "OR"];
  const clauses = document.getElementById("clauses");

  const newClause = document.createElement("div");
  newClause.className = "clauseContainer";

  const operator = document.createElement("select");
  operator.className = "operator";
  operators.forEach((op) => {
    const val = document.createElement("option");
    val.value = op;
    val.text = op;
    operator.appendChild(val);
  });

  const attribute = document.createElement("select");
  attribute.className = "attribute";
  attributes.forEach((atr) => {
    const val = document.createElement("option");
    val.value = atr;
    val.text = atr;
    attribute.appendChild(val);
  });

  const equatee = document.createElement("input");
  equatee.type = "text";
  equatee.className = "equatee";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.innerText = "X";
  remove.onclick = () => newClause.remove();

  newClause.appendChild(operator);
  newClause.appendChild(attribute);
  newClause.append("=");
  newClause.appendChild(equatee);
  newClause.appendChild(remove);
  document.getElementById("clauses").appendChild(newClause);
}

// get and organize all the components of each query
function getBedClauses() {
  const firstClause = document.getElementById("firstClause");
  const clauses = document.getElementById("clauses");
  const containers = clauses.querySelectorAll(".clauseContainer");
  const operators = [];
  const attributes = [];
  const equatees = [];

  if (firstClause.querySelector(".attribute").value != "None") {
    if (firstClause.querySelector(".equatee").value === "")
      throw new Error("Input left blank!");
    attributes.push(firstClause.querySelector(".attribute").value);
    equatees.push(firstClause.querySelector(".equatee").value);

    containers.forEach((c) => {
      if (c.querySelector(".equatee").value === "")
        throw new Error("Input left blank!");
      operators.push(c.querySelector(".operator").value);
      attributes.push(c.querySelector(".attribute").value);
      equatees.push(c.querySelector(".equatee").value);
    });
  }
  return { operators, attributes, equatees };
}

// Fetches & displays data from ToolShedLocatedAt table
async function fetchAndDisplayToolShedLocatedAt() {
  const tableElement = document.getElementById("toolShedLocatedAtTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/toolshedlocatedattable", {
    method: "GET",
  });

  const responseData = await response.json();
  const ToolShedLocatedAtTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  ToolShedLocatedAtTableContent.forEach((rec) => {
    const row = tableBody.insertRow();
    rec.forEach((field, index) => {
      const cell = row.insertCell(index);
      if (index == 1) cell.textContent = new Date(field).toLocaleDateString();
      else cell.textContent = field;
    });
  });
}

// fetches & displays available plots in Plot table
async function fetchAndDisplayAvailablePlots() {
  const tableElement = document.getElementById("availablePlots");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/avplottable", {
    method: "GET",
  });

  const responseData = await response.json();
  const plotTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  plotTableContent.forEach((rec) => {
    const row = tableBody.insertRow();
    rec.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

// dynamically updates the input fields of Update Attribute in ToolShedLocatedAt depending on selected attribute
async function displayToolShedLocatedAtAttribute() {
  const attributeName = document.getElementById("attributeName").value;
  const toolShedLocatedAtFields = document.getElementById(
    "toolShedLocatedAtFields",
  );

  switch (attributeName) {
    case "capacity":
      toolShedLocatedAtFields.innerHTML = `
              <br>New Capacity: <input type="number" id="updateNewCapacity" placeholder="Enter New Capcity" required><br>
          `;
      break;
    case "numTools":
      toolShedLocatedAtFields.innerHTML = `
              <br>New NumTools: <input type="number" id="updateNewNumTools" placeholder="Enter New NumTools" required> <br>
          `;
      break;
    case "conditionLevel":
      toolShedLocatedAtFields.innerHTML = `
              <br>New ConditionLevel: <input type="number" id="updateNewConditionLevel" placeholder="Enter New ConditionLevel"> <br>
          `;
      break;
    case "plotID":
      toolShedLocatedAtFields.innerHTML = `
              <br>New PlotID: <input type="number" id="updateNewPlotID" placeholder="Enter New PlotID" required> <br>
              <h3> Available Plots </h3>
                  <table id="availablePlots" border="1">
                      <thead>
                          <tr>
                              <th>PlotSize</th>
                              <th>IsAvailable</th>
                              <th>PlotID</th>
                              <th>IsIndoor</th>
                          </tr>
                      </thead>
                  <tbody>
                  </tbody>
          </table><br>
          `;

      // fetches and displays Plot table when table exists in html (plotID is chosen)
      fetchAndDisplayAvailablePlots();
      break;
  }
}

// helper function to update ToolShedLocatedAt Capacity
async function updateToolShedLocatedAtCapacity() {
  const toolShedIDValue = document.getElementById("updateToolShedLocatedAtShedID").value;
  const newCapacityValue = document.getElementById("updateNewCapacity").value;

  const response = await fetch("/update-capacity-toolshedlocatedattable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      toolShedID: toolShedIDValue,
      newCapacity: newCapacityValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById(
    "updateToolShedLocatedAtResultMsg",
  );

  if (responseData.success) {
    messageElement.textContent = "Capacity updated successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

// helper function to update ToolShedLocatedAt NumTools
async function updateToolShedLocatedAtNumTools() {
  const toolShedIDValue = document.getElementById("updateToolShedLocatedAtShedID").value;
  const newNumToolsValue = document.getElementById("updateNewNumTools").value;

  const response = await fetch("/update-numtools-toolshedlocatedattable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      toolShedID: toolShedIDValue,
      newNumTools: newNumToolsValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById(
    "updateToolShedLocatedAtResultMsg",
  );

  if (responseData.success) {
    messageElement.textContent = "NumTools updated successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

// helper function to update ToolShedLocatedAt ConditionLevel
async function updateToolShedLocatedAtConditionLevel() {
  const toolShedIDValue = document.getElementById("updateToolShedLocatedAtShedID").value;
  const NewConditionLevelValue = document.getElementById(
    "updateNewConditionLevel",
  ).value;

  const response = await fetch(
    "/update-conditionlevel-toolshedlocatedattable",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toolShedID: toolShedIDValue,
        NewConditionLevel: NewConditionLevelValue,
      }),
    },
  );

  const responseData = await response.json();
  const messageElement = document.getElementById(
    "updateToolShedLocatedAtResultMsg",
  );

  if (responseData.success) {
    messageElement.textContent = "ConditionLevel updated successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

// helper function to update ToolShedLocatedAt PlotID
async function updateToolShedLocatedAtPlotID() {
  const toolShedIDValue = document.getElementById("updateToolShedLocatedAtShedID").value;
  const NewPlotIDValue = document.getElementById("updateNewPlotID").value;

  const response = await fetch("/update-plotid-toolshedlocatedattable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      toolShedID: toolShedIDValue,
      NewPlotID: NewPlotIDValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById(
    "updateToolShedLocatedAtResultMsg",
  );

  if (responseData.success) {
    messageElement.textContent = "PlotID updated successfully!";
    fetchTableData();
    fetchAndDisplayAvailablePlots();
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

// Updates an attribute in the ToolShedLocatedAt table depending on selected attribute
async function updateToolShedLocatedAt(event) {
  event.preventDefault();

  const attributeName = document.getElementById("attributeName").value;

  switch (attributeName) {
    case "capacity":
      updateToolShedLocatedAtCapacity();
      break;
    case "numTools":
      updateToolShedLocatedAtNumTools();
      break;
    case "conditionLevel":
      updateToolShedLocatedAtConditionLevel();
      break;
    case "plotID":
      updateToolShedLocatedAtPlotID();
      break;
  }
}

// Sum values in the harvests.
async function sumHarvests() {
  const tableElement = document.getElementById("harvestSumTable");
  const tableBody = tableElement.querySelector("tbody");

  tableElement.style.display = "table";

  const response = await fetch("/sum-harvests", {
    method: "GET",
  });

  const responseData = await response.json();
  const sumHarvestTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  sumHarvestTableContent.forEach((user) => {
    const row = tableBody.insertRow();
    user.forEach((field, index) => {
      const cell = row.insertCell(index);
      if (index === 0) cell.textContent = new Date(field).toLocaleDateString();
      else cell.textContent = field;
    });
  });
}

// Fetches & displays the requested attributed from the water schedule table
async function projectWaterSchedule(event) {
  event.preventDefault();
  const tableElement = document.getElementById("scheduleTable");
  const tableHead = tableElement.querySelector("thead");
  const tableBody = tableElement.querySelector("tbody");

  if (tableHead) tableHead.innerHTML = "";
  if (tableBody) tableBody.innerHTML = "";
  const attributes = document.querySelectorAll(".waterAttribute");
  const attributeRanks = [];

  attributes.forEach((elm) => {
    const val = parseInt(elm.value, 10);
    if (val != 0) {
      attributeRanks.push({
        attribute: elm.name,
        rank: val,
      });
    }
  });
  attributeRanks.sort((a, b) => a.rank - b.rank);
  const attributeTitles = attributeRanks.map((pair) => pair.attribute);

  const messageElement = document.getElementById("projScheduleResultMsg");
  if (attributeTitles.length === 0) {
    messageElement.textContent = "No attributes selected.";
    return;
  }

  const headRow = tableHead.insertRow();
  attributeTitles.forEach((user, index) => {
    headRow.insertCell(index).textContent = user;
  });

  const sqlString = attributeTitles.join(", ");
  const params = new URLSearchParams({ string: sqlString });
  const response = await fetch(`/projectSchedule?${params.toString()}`, {
    method: "GET",
  });

  const responseData = await response.json();
  const watScheduleContent = responseData.data;
  console.log(responseData);

  watScheduleContent.forEach((user) => {
    const row = tableBody.insertRow();
    user.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });

  messageElement.textContent = "Attributes selected successfully.";
}

// Fetches & displays harvest date, weight, value, and cropname from joined HarvestYields and Crop tables
async function joinHarvestYieldsAndCropGivenCropName(event) {
  event.preventDefault();

  const cropNameValue = document.getElementById("findHarvestCropName").value;
  const tableElement = document.getElementById("harvestGivenCropTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/joinharvestyieldsandcrop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cropName: cropNameValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById(
    "findHarvestGivenCropResultMsg",
  );

  if (responseData.success) {
    const harvestGivenCropTableContent = responseData.data;

    if (tableBody) {
      tableBody.innerHTML = "";
    }

    harvestGivenCropTableContent.forEach((rec) => {
      const row = tableBody.insertRow();
      rec.forEach((field, index) => {
        const cell = row.insertCell(index);
        if (index == 0) cell.textContent = new Date(field).toLocaleDateString();
        else cell.textContent = field;
      });
    });

    tableElement.style.display = "table";

    messageElement.textContent =
      "Harvest date, weight, and value given a crop name was successfully found!";
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

// fetches & displays Crop table
async function fetchAndDisplayCrop() {
  const tableElement = document.getElementById("cropTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/croptable", {
    method: "GET",
  });

  const responseData = await response.json();
  const cropTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  cropTableContent.forEach((rec) => {
    const row = tableBody.insertRow();
    rec.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

// Finds the number of plots
async function findGardenersMoreThanOnePlot() {
  const tableElement = document.getElementById("gardenersMoreThanOnePlotTable");
  const tableBody = tableElement.querySelector("tbody");

  tableElement.style.display = "table";

  const response = await fetch("/gardenersmorethanoneplottable", {
    method: "GET",
  });

  const responseData = await response.json();
  const gardenersMoreThanOnePlotTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  gardenersMoreThanOnePlotTableContent.forEach((user) => {
    const row = tableBody.insertRow();
    user.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

// Finds the average equipment condition by shed where they must be lower
// than the overall average condition level of that equipment type
async function findLowestAvgEquipmentConditionByShed() {
  const tableElement = document.getElementById(
    "lowestAvgEquipmentConditionByShedTable",
  );
  const tableBody = tableElement.querySelector("tbody");

  tableElement.style.display = "table";

  const response = await fetch("/lowestavgequipmentconditionbyshedtable", {
    method: "GET",
  });

  const responseData = await response.json();
  const lowestAvgEquipmentConditionByShedTableContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  lowestAvgEquipmentConditionByShedTableContent.forEach((user) => {
    const row = tableBody.insertRow();
    user.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

// !!!
// ---------------------------------------------------------------
// GARDENER functions

// fetch gardener table and displays it
async function fetchAndDisplayGardener() {
  const tableElement = document.getElementById("gardenerTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/gardener", {
    method: "GET",
  });

  const responseData = await response.json();
  const gardenerContent = responseData.data;

  // clear old data before fetching new data
  if (tableBody) {
    tableBody.innerHTML = "";
  }

  gardenerContent.forEach((gardener) => {
    const row = tableBody.insertRow();
    gardener.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

async function insertGardener(event) {
  event.preventDefault();

  const firstNameValue = document.getElementById(
    "gardenerInsertFirstName",
  ).value;
  const lastNameValue = document.getElementById("gardenerInsertLastName").value;
  const residenceUnitNumValue = document.getElementById(
    "gardenerInsertResidenceUnitNum",
  ).value;
  const gardenerIDValue = document.getElementById("gardenerInsertID").value;
  const emailValue = document.getElementById("gardenerInsertEmail").value;

  const response = await fetch("/insert-gardener", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: firstNameValue,
      lastName: lastNameValue,
      residenceUnitNum: residenceUnitNumValue,
      gardenerID: gardenerIDValue,
      email: emailValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("gardenerInsertResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Gardener inserted successfully!";
    event.target.reset();
    fetchTableData();
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

async function updateGardener(event) {
  event.preventDefault();

  const firstNameValue = document.getElementById(
    "gardenerUpdateFirstName",
  ).value;
  const lastNameValue = document.getElementById("gardenerUpdateLastName").value;
  const residenceUnitNumValue = document.getElementById(
    "gardenerUpdateResidenceUnitNum",
  ).value;
  const gardenerIDValue = document.getElementById("gardenerUpdateID").value;

  const response = await fetch("/update-gardener", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: firstNameValue,
      lastName: lastNameValue,
      residenceUnitNum: residenceUnitNumValue,
      gardenerID: gardenerIDValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("gardenerUpdateResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Gardener updated successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = "Error updating gardener!";
  }
}

async function deleteGardener(event) {
  event.preventDefault();

  const gardenerIDValue = document.getElementById("gardenerDeleteID").value;

  const response = await fetch("/delete-gardener", {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      gardenerID: gardenerIDValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("gardenerDeleteResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Gardener deleted successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = "Error deleting gardener!";
  }
}

async function fetchGardenerRentingAllPlotsOfType() {
  const isIndoorValue = document.querySelector(
    'input[name="plotTypeQuery"]:checked',
  ).value;

  const response = await fetch(
    `/gardener-renting-all-plots-of-type?isIndoor=${isIndoorValue}`,
    { method: "GET" },
  );

  const responseData = await response.json();
  const resultList = document.getElementById("divisionResultList");
  const messageElement = document.getElementById("divisionResultMsg");

  resultList.innerHTML = "";

  const plotTypeLabel = isIndoorValue === "1" ? "indoor" : "outdoor";

  // build list of gardeners that rent all plots of type
  if (responseData.data && responseData.data.length > 0) {
    messageElement.textContent = "";
    responseData.data.forEach(([gardenerId, firstName, lastName]) => {
      const li = document.createElement("li");
      li.textContent = `Gardener ${gardenerId}: ${firstName} ${lastName}`;
      resultList.appendChild(li);
    });
  } else {
    messageElement.textContent = `No gardeners currently rent all ${plotTypeLabel} plots.`;
  }
}

// ---------------------------------------------------------------
// PLOT functions

async function fetchAndDisplayPlot() {
  const tableElement = document.getElementById("plotTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/plot", {
    method: "GET",
  });

  const responseData = await response.json();
  const plotContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  plotContent.forEach((plot) => {
    const row = tableBody.insertRow();
    plot.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

async function insertPlot(event) {
  event.preventDefault();

  const plotSizeValue = document.getElementById("plotInsertSize").value;
  const isAvailableValue = document.getElementById(
    "plotInsertIsAvailable",
  ).checked;
  const plotIdValue = document.getElementById("plotInsertId").value;
  const isIndoorValue = document.getElementById("plotInsertIsIndoor").checked;

  const response = await fetch("/insert-plot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plotSize: plotSizeValue,
      isAvailable: isAvailableValue,
      plotId: plotIdValue,
      isIndoor: isIndoorValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("plotInsertResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Plot inserted successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = responseData.errMessage;
  }
}

// ---------------------------------------------------------------
// Equipment functions

const EQUIPMENT_SUBTYPE_COLUMNS = {
  GARDENHOE: [
    ["Plots Tilled", 6],
    ["Tool Size", 7],
    ["Date Last Sharpened", 8],
  ],
  WATERINGCAN: [
    ["Max Volume", 9],
    ["Spout", 10],
    ["Material", 11],
  ],
  SHOVEL: [
    ["Manufacturer", 12],
    ["Shape", 13],
    ["Shaft Length", 14],
  ],
  PRUNER: [
    ["Manufacturer", 15],
    ["Tool Size", 16],
    ["Type", 17],
  ],
};

const SUBTYPE_NAMES = {
  GARDENHOE: "Garden Hoe",
  WATERINGCAN: "Watering Can",
  SHOVEL: "Shovel",
  PRUNER: "Pruner",
};

// helper to find matching subtype
function findMatchingSubtype(row) {
  // ex. ["Subtype", [["Attribute", value], ... ]],
  for (const [subtype, cols] of Object.entries(EQUIPMENT_SUBTYPE_COLUMNS)) {
    // check if first attribute value pairs has values
    const [, firstColumnIndex] = cols[0];
    const matchingSubtype = row[firstColumnIndex] !== null;
    if (matchingSubtype) {
      return { name: SUBTYPE_NAMES[subtype], cols };
    }
  }
  // partial case (not a subtype)
  return null;
}

// helper to get correct subtype attributes
function getEquipmentAttributePairs(row) {
  const subtype = findMatchingSubtype(row);
  if (!subtype) return null;
  
  return subtype.cols.map(([label, i]) => {
    const value = row[i];
    if (label === "Date Last Sharpened") {
      const dateValue = value ? new Date(value).toLocaleDateString() : " ";
      return [label, dateValue];
    } else {
      return [label, value ?? " "];
    }
  });
}

async function fetchAndDisplayEquipment() {
  const tableElement = document.getElementById("equipmentTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/equipment", {
    method: "GET",
  });

  const responseData = await response.json();
  const equipmentContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  equipmentContent.forEach((equipment) => {
    const row = tableBody.insertRow();
    // insert the base columns:
    // equipment_id, purchase_date, equipment_type, shed_id, condition_level, gardener_id, equipment_name
    for (let i = 0; i < 6; i++) {
      const cell = row.insertCell(i);
      const value = equipment[i];
      if (i === 1) {
        cell.textContent = new Date(value).toLocaleDateString();
      } else {
        cell.textContent = value ?? " ";
      }
    }

    // subtype attributes
    const attributesCell = row.insertCell(6);
    const pairs = getEquipmentAttributePairs(equipment);
    if (!pairs) {
      // no subtype specified (partial ISA case)
      attributesCell.textContent = " ";
    } else {
      // add subtype attribute pairs [label, value]
      const list = document.createElement("ul");
      pairs.forEach(([label, value]) => {
        const item = document.createElement("li");
        item.textContent = `${label}: ${value}`;
        list.appendChild(item);
      });
      attributesCell.appendChild(list);
    }
  });
}

// helper that shows/hides fieldsets depending on the equipment type added
function toggleEquipmentTypeFields() {
  const selectedType = document.getElementById("equipmentInsertName").value;
  const fieldsetIdByType = {
    GardenHoe: "fieldsGardenHoe",
    WateringCan: "fieldsWateringCan",
    Shovel: "fieldsShovel",
    Pruner: "fieldsPruner",
  };

  document.querySelectorAll(".type-fields").forEach((fieldset) => {
    fieldset.hidden = true;
  });

  const targetId = fieldsetIdByType[selectedType];
  if (targetId) {
    document.getElementById(targetId).hidden = false;
  }
}

// helper that gets the equipment attribute values
function buildEquipmentTypeAttributes(equipmentType) {
  switch (equipmentType) {
    case "GardenHoe":
      return {
        plotsTilled: document.getElementById("gardenHoePlotsTilled").value,
        toolSize: document.getElementById("gardenHoeToolSize").value,
        dateLastSharpened: document.getElementById("gardenHoeDateLastSharpened")
          .value,
      };
    case "WateringCan":
      return {
        maxVolume: document.getElementById("wateringCanMaxVolume").value,
        spout: document.getElementById("wateringCanSpout").value,
        material: document.getElementById("wateringCanMaterial").value,
      };
    case "Shovel":
      return {
        manufacturer: document.getElementById("shovelManufacturer").value,
        shape: document.getElementById("shovelShape").value,
        shaftLength: document.getElementById("shovelShaftLength").value,
      };
    case "Pruner":
      return {
        manufacturer: document.getElementById("prunerManufacturer").value,
        toolSize: document.getElementById("prunerToolSize").value,
        type: document.getElementById("prunerType").value,
      };
    default:
      // no subtype
      return {};
  }
}

async function insertEquipment(event) {
  event.preventDefault();

  const equipmentIdValue = document.getElementById("equipmentInsertId").value;
  const purchaseDateValue = document.getElementById(
    "equipmentInsertPurchaseDate",
  ).value;
  const equipmentTypeValue = document.getElementById(
    "equipmentInsertType",
  ).value;
  const shedIdValue = document.getElementById("equipmentInsertShedId").value;
  const conditionLevelValue = document.getElementById(
    "equipmentInsertConditionLevel",
  ).value;
  const gardenerIdValue = document.getElementById(
    "equipmentInsertGardenerId",
  ).value;
  const equipmentNameValue = document.getElementById("equipmentInsertName").value;
  const typeAttributes = buildEquipmentTypeAttributes(equipmentNameValue);

  const response = await fetch("/insert-equipment", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      equipmentId: equipmentIdValue,
      purchaseDate: purchaseDateValue,
      equipmentType: equipmentTypeValue,
      shedId: shedIdValue,
      conditionLevel: conditionLevelValue,
      gardenerId: gardenerIdValue,
      equipmentName: equipmentNameValue,
      typeAttributes,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("equipmentInsertResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Equipment inserted successfully!";
    event.target.reset();
    toggleEquipmentTypeFields();
    fetchTableData();
  } else {
    messageElement.textContent = "Error inserting equipment!";
  }
}

async function deleteEquipment(event) {
  event.preventDefault();

  const equipmentIdValue = document.getElementById("equipmentDeleteId").value;

  const response = await fetch("/delete-equipment", {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      equipmentId: equipmentIdValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("equipmentDeleteResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Equipment deleted successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = "Error deleting equipment!";
  }
}

async function checkoutEquipment(event) {
  event.preventDefault();

  const gardenerIdValue = document.getElementById(
    "equipmentCheckoutGardenerId",
  ).value;
  const equipmentIdValue = document.getElementById("equipmentCheckoutId").value;

  const response = await fetch("/checkout-equipment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gardenerId: gardenerIdValue,
      equipmentId: equipmentIdValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("checkoutEquipmentResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Equipment checked out successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = "Error checking out equipment!";
  }
}

async function returnEquipment(event) {
  event.preventDefault();

  const gardenerIdValue = document.getElementById(
    "equipmentReturnGardenerId",
  ).value;
  const equipmentIdValue = document.getElementById("equipmentReturnId").value;

  const response = await fetch("/return-equipment", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gardenerId: gardenerIdValue,
      equipmentId: equipmentIdValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("returnEquipmentResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Equipment returned successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = "Error returning equipment!";
  }
}

// ---------------------------------------------------------------
// RENTS functions (Gardener -- Rents -- Plots)

async function fetchAndDisplayRents() {
  const tableElement = document.getElementById("rentsTable");
  const tableBody = tableElement.querySelector("tbody");

  const response = await fetch("/rents", {
    method: "GET",
  });

  const responseData = await response.json();
  const rentsContent = responseData.data;

  if (tableBody) {
    tableBody.innerHTML = "";
  }

  rentsContent.forEach((rent) => {
    const row = tableBody.insertRow();
    rent.forEach((field, index) => {
      const cell = row.insertCell(index);
      cell.textContent = field;
    });
  });
}

async function rentPlot(event) {
  event.preventDefault();

  const gardenerIDValue = document.getElementById("rentGardenerID").value;
  const plotIDValue = document.getElementById("rentPlotID").value;

  const response = await fetch("/rent-plot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gardenerID: gardenerIDValue,
      plotID: plotIDValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("rentPlotResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Plot rented successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = "Error renting plot!";
  }
}

async function returnPlot(event) {
  event.preventDefault();

  const gardenerIDValue = document.getElementById("returnGardenerID").value;
  const plotIDValue = document.getElementById("returnPlotID").value;

  const response = await fetch("/return-plot", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gardenerID: gardenerIDValue,
      plotID: plotIDValue,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById("returnPlotResultMsg");

  if (responseData.success) {
    messageElement.textContent = "Plot returned successfully!";
    fetchTableData();
  } else {
    messageElement.textContent = "Error returning plot!";
  }
}

// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function () {
  checkDbConnection();
  fetchTableData();

  document
    .getElementById("insertPlantRec")
    .addEventListener("submit", insertPlantRec);
  document.getElementById("addClause").addEventListener("click", addClause);
  document.getElementById("searchBed").addEventListener("submit", selectBeds);

  document
    .getElementById("attributeName")
    .addEventListener("change", displayToolShedLocatedAtAttribute);
  document
    .getElementById("updateToolShedLocatedAt")
    .addEventListener("submit", updateToolShedLocatedAt);

  document
    .getElementById("harvestTotal")
    .addEventListener("click", sumHarvests);
  document
    .getElementById("scheduleProjectForm")
    .addEventListener("submit", projectWaterSchedule);

  document
    .getElementById("findHarvestGivenCrop")
    .addEventListener("submit", joinHarvestYieldsAndCropGivenCropName);

  document
    .getElementById("findGardenersMoreThanOnePlot")
    .addEventListener("click", findGardenersMoreThanOnePlot);

  document
    .getElementById("findLowestAvgEquipmentConditionByShed")
    .addEventListener("click", findLowestAvgEquipmentConditionByShed);

  // Gardener listeners
  document
    .getElementById("insertGardener")
    .addEventListener("submit", insertGardener);
  document
    .getElementById("updateGardener")
    .addEventListener("submit", updateGardener);
  document
    .getElementById("deleteGardener")
    .addEventListener("submit", deleteGardener);
  document
    .getElementById("runDivisionQuery")
    .addEventListener("click", fetchGardenerRentingAllPlotsOfType);

  // Plot listeners
  document.getElementById("insertPlot").addEventListener("submit", insertPlot);
  document.getElementById("rentPlot").addEventListener("submit", rentPlot);
  document.getElementById("returnPlot").addEventListener("submit", returnPlot);

  // Equipment listeners
  document
    .getElementById("insertEquipment")
    .addEventListener("submit", insertEquipment);
  document
    .getElementById("deleteEquipment")
    .addEventListener("submit", deleteEquipment);
  document
    .getElementById("checkoutEquipment")
    .addEventListener("submit", checkoutEquipment);
  document
    .getElementById("returnEquipment")
    .addEventListener("submit", returnEquipment);
  document
    .getElementById("equipmentInsertName")
    .addEventListener("change", toggleEquipmentTypeFields);
};

// General function to refresh the displayed table data.
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
  fetchAndDisplayPlantRec();
  fetchAndDisplayAvailableBeds();
  fetchAndDisplayToolShedLocatedAt();
  fetchAndDisplayCrop();

  fetchAndDisplayGardener();

  fetchAndDisplayPlot();
  fetchAndDisplayEquipment();
  fetchAndDisplayRents();
}
