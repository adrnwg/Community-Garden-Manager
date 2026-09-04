-- Drop Tables --
-- Relationships --
DROP TABLE Logs;
DROP TABLE Taken;
DROP TABLE PlantedIn;
DROP TABLE Records;
DROP TABLE Rents;
DROP TABLE AssignedTo;
DROP TABLE Oversees;

-- Isa --
DROP TABLE GardenHoe;
DROP TABLE WateringCan;
DROP TABLE Shovel;
DROP TABLE Pruner;
DROP TABLE StoresAndCheckedOutEquipment2;
DROP TABLE StoresAndCheckedOutEquipment1;

-- Objects --
DROP TABLE ToolShedLocatedAt2;
DROP TABLE ToolShedLocatedAt1;
DROP TABLE PlantingRecordTracks;
DROP TABLE BedContains;
DROP TABLE Plot;
DROP TABLE HarvestYields1;
DROP TABLE HarvestYields2;
DROP TABLE Gardener4;
DROP TABLE Gardener3;
DROP TABLE Gardener2;
DROP TABLE WaterSchedule1;
DROP TABLE WaterSchedule2;
DROP TABLE Crop1;
DROP TABLE Crop2;

-- Views --
DROP VIEW WATERSCHEDULEFULL;
DROP VIEW TOOLSHEDLOCATEDATFULL;
DROP VIEW HARVESTYIELDSFULL;
DROP VIEW CROPFULL;
DROP VIEW GARDENERFULL;
DROP VIEW STORESANDCHECKEDOUTEQUIPMENTFULL;

-- Create Tables --

CREATE TABLE Crop2 (
CropName VARCHAR(50)  PRIMARY KEY,
CropUsage VARCHAR(100)
);


CREATE TABLE Crop1 (
Species VARCHAR(50) PRIMARY KEY,
CropName VARCHAR(50)  NOT NULL,
GrowingSeason VARCHAR(20) NOT NULL,
FOREIGN KEY (CropName) REFERENCES Crop2(CropName)
);


CREATE TABLE HarvestYields2 (
Weight INT,
Value INT NOT NULL,
Species VARCHAR(50),
PRIMARY KEY (Weight, Species),
FOREIGN KEY (Species) REFERENCES Crop1(Species)
);


CREATE TABLE HarvestYields1 (
HarvestID INT PRIMARY KEY,
HarvestDate DATE NOT NULL,
Weight INT NOT NULL,
Species VARCHAR(50) NOT NULL,
FOREIGN KEY (Species) REFERENCES Crop1(Species),
FOREIGN KEY (Weight, Species) REFERENCES HarvestYields2(Weight, Species)
);


CREATE TABLE Gardener2 (
LastName VARCHAR(30) NOT NULL,
Email VARCHAR(50) PRIMARY KEY
);


CREATE TABLE Gardener3 (
FirstName VARCHAR(30) NOT NULL,
Email VARCHAR(50) PRIMARY KEY,
FOREIGN KEY (Email) REFERENCES Gardener2(Email)
);


CREATE TABLE Gardener4 (
ResidenceUnitNum INT NOT NULL,
GardenerID INT PRIMARY KEY,
Email VARCHAR(50) UNIQUE,
FOREIGN KEY (Email) REFERENCES Gardener2(Email)
);


CREATE TABLE Plot (
PlotSize INT,
IsAvailable NUMBER(1) NOT NULL,
PlotID INT PRIMARY KEY,
IsIndoor NUMBER(1)
);


CREATE TABLE WaterSchedule2 (
Frequency INT,
Amount INT NOT NULL,
StartTime VARCHAR(50),
PRIMARY KEY (StartTime, Frequency)
);


CREATE TABLE WaterSchedule1 (
Frequency INT NOT NULL,
ScheduleID INT PRIMARY KEY,
StartTime VARCHAR(50) NOT NULL,
Temp INT,
FOREIGN KEY (StartTime, Frequency) REFERENCES WaterSchedule2(StartTime, Frequency)
);


CREATE TABLE BedContains (
Length INT NOT NULL,
Width INT NOT NULL,
Height INT NOT NULL,
FertilizerType VARCHAR(30),
BedID INT,
PlotID INT,
PRIMARY KEY (BedID, PlotID),
FOREIGN KEY (PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE
);


CREATE TABLE PlantingRecordTracks (
PlantingID INT PRIMARY KEY,
PlantingStyle VARCHAR(100),
QuantityPlanted INT,
PlantedDate DATE,
ExpectedHarvestDate DATE,
BedID INT NOT NULL,
PlotID INT NOT NULL,
CONSTRAINT unique_bed UNIQUE (BedID, PlotID),
FOREIGN KEY(BedID, PlotID) REFERENCES BedContains(BedID, PlotID)
);


CREATE TABLE ToolShedLocatedAt1 (
LastCleanDate DATE PRIMARY KEY,
ConditionLevel INT
);


CREATE TABLE ToolShedLocatedAt2 (
ShedID INT PRIMARY KEY,
LastCleanDate DATE,
Capacity INT NOT NULL,
NumTools INT NOT NULL,
PlotID INT NOT NULL UNIQUE,
FOREIGN KEY(PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE,
FOREIGN KEY (LastCleanDate) REFERENCES ToolShedLocatedAt1(LastCleanDate)
);


CREATE TABLE StoresAndCheckedOutEquipment1 (
PurchaseDate DATE PRIMARY KEY,
ConditionLevel INT
);


CREATE TABLE StoresAndCheckedOutEquipment2 (
EquipmentID INT PRIMARY KEY,
PurchaseDate DATE  NOT NULL,
EquipmentType VARCHAR(50)  NOT NULL,
ShedID INT,
GardenerID INT,
FOREIGN KEY (ShedID) REFERENCES ToolShedLocatedAt2(ShedID)
ON DELETE SET NULL,
FOREIGN KEY (GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE SET NULL,
FOREIGN KEY (PurchaseDate) REFERENCES StoresAndCheckedOutEquipment1(PurchaseDate)
);


CREATE TABLE GardenHoe (
EquipmentID INT PRIMARY KEY,
PlotsTilled INT,
ToolSize INT NOT NULL,
DateLastSharpened DATE,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);


CREATE TABLE WateringCan (
EquipmentID INT PRIMARY KEY,
MaxVolume INT NOT NULL,
Spout VARCHAR(30) NOT NULL,
Material VARCHAR(30) NOT NULL,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);


CREATE TABLE Shovel (
EquipmentID INT PRIMARY KEY,
Manufacturer VARCHAR(30) NOT NULL,
Shape VARCHAR(30) NOT NULL,
Length INT NOT NULL,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);


CREATE TABLE Pruner (
EquipmentID INT PRIMARY KEY,
Manufacturer VARCHAR(30) NOT NULL,
ToolSize INT NOT NULL,
Type VARCHAR(30) NOT NULL,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);




CREATE TABLE Logs (
GardenerID INT,
HarvestID INT,
PRIMARY KEY(GardenerID, HarvestID),
FOREIGN KEY (GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE CASCADE,
FOREIGN KEY (HarvestID) REFERENCES HarvestYields1(HarvestID)
ON DELETE CASCADE
);


CREATE TABLE Taken (
HarvestID INT,
BedID INT,
PlotID INT,
PRIMARY KEY(HarvestID, BedID, PlotID),
FOREIGN KEY (HarvestID) REFERENCES HarvestYields1(HarvestID)
ON DELETE CASCADE,
FOREIGN KEY (BedID, PlotID) REFERENCES BedContains(BedID, PlotID)
ON DELETE CASCADE
);


CREATE TABLE PlantedIn (
BedID INT,
PlotID INT,
Species VARCHAR(50),
PRIMARY KEY(BedID, PlotID, Species),
FOREIGN KEY(BedID, PlotID) REFERENCES BedContains(BedID, PlotID)
ON DELETE CASCADE,
FOREIGN KEY(Species) REFERENCES Crop1(Species)
ON DELETE CASCADE
);


CREATE TABLE Records (
Species VARCHAR(50),
PlantingID INT,
PRIMARY KEY(Species, PlantingID),
FOREIGN KEY(Species) REFERENCES Crop1(Species)
ON DELETE CASCADE,
FOREIGN KEY(PlantingID) REFERENCES PlantingRecordTracks(PlantingID)
ON DELETE CASCADE
);


CREATE TABLE Rents (
GardenerID INT,
PlotID INT,
PRIMARY KEY(GardenerID, PlotID),
FOREIGN KEY(GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE CASCADE,
FOREIGN KEY(PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE
);


CREATE TABLE AssignedTo (
PlotID INT,
ScheduleID INT,
PRIMARY KEY (PlotID, ScheduleID),
FOREIGN KEY (ScheduleID) REFERENCES WaterSchedule1(ScheduleID)
ON DELETE CASCADE,
FOREIGN KEY (PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE
);


CREATE TABLE Oversees (
ScheduleID INT,
GardenerID INT,
PRIMARY KEY(ScheduleID, GardenerID),
FOREIGN KEY(ScheduleID) REFERENCES WaterSchedule1(ScheduleID)
ON DELETE CASCADE,
FOREIGN KEY(GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE CASCADE
);

CREATE OR REPLACE VIEW WATERSCHEDULEFULL AS
    SELECT w1.SCHEDULEID, w1.FREQUENCY, w1.STARTTIME, w1.TEMP, w2.AMOUNT
    FROM WATERSCHEDULE1 w1
    JOIN WATERSCHEDULE2 w2 ON w1.STARTTIME = w2.STARTTIME AND w1.FREQUENCY = w2.FREQUENCY;

CREATE OR REPLACE VIEW TOOLSHEDLOCATEDATFULL AS
    SELECT t2.ShedID AS ShedID, t1.LastCleanDate AS LastCleanDate, t2.Capacity AS Capacity, t2.NumTools AS NumTools, t1.ConditionLevel AS ConditionLevel, t2.PlotID AS PlotID
    FROM ToolShedLocatedAt1 t1
    JOIN ToolShedLocatedAt2 t2 ON t1.LastCleanDate = t2.LastCleanDate;

CREATE OR REPLACE VIEW HARVESTYIELDSFULL AS
    SELECT h1.HarvestID AS HarvestID, h1.HarvestDate AS HarvestDate, h2.Weight AS Weight, h2.Value AS Value, h2.Species AS Species
    FROM HarvestYields1 h1
    JOIN HarvestYields2 h2 ON h1.weight = h2.weight AND h1.species = h2.species;

CREATE OR REPLACE VIEW CROPFULL AS
    SELECT c1.Species, c2.CropName, c1.GrowingSeason, c2.CropUsage
    FROM Crop1 c1
    JOIN Crop2 c2 ON c1.CropName = c2.CropName;

CREATE OR REPLACE VIEW GARDENERFULL AS
    SELECT g3.FirstName, g2.LastName, g4.ResidenceUnitNum, g4.GardenerID, g2.Email
    FROM Gardener2 g2
    JOIN Gardener3 g3 ON g3.Email = g2.Email
    JOIN Gardener4 g4 ON g4.Email = g2.Email;

CREATE OR REPLACE VIEW STORESANDCHECKEDOUTEQUIPMENTFULL AS
    SELECT s2.EquipmentID, s1.PurchaseDate, s2.EquipmentType, s1.ConditionLevel, s2.ShedID, s2.GardenerID
    FROM StoresAndCheckedOutEquipment1 s1
    JOIN StoresAndCheckedOutEquipment2 s2 ON s2.PurchaseDate = s1.PurchaseDate;

--------------- Insert Tuples ---------------

INSERT INTO Crop2 VALUES ('Carrot', 'Juicing');
INSERT INTO Crop2 VALUES ('Lettuce', 'Salads');
INSERT INTO Crop2 VALUES ('Corn', 'Grilled corn');
INSERT INTO Crop2 VALUES ('Tomato', 'Tomato sauces');
INSERT INTO Crop2 VALUES ('Kale', 'Smoothies');
INSERT INTO Crop2 VALUES ('Onion', 'Onion boil');
INSERT INTO Crop2 VALUES ('Broccoli', 'Bully kids');

INSERT INTO Crop1 VALUES ( 'Daucus carota', 'Carrot', 'Spring');
INSERT INTO Crop1 VALUES ('Lactuca sativa', 'Lettuce', 'Spring, Summer');
INSERT INTO Crop1 VALUES ('Zea mays', 'Corn', 'Summer, Autumn');
INSERT INTO Crop1 VALUES ('Solanum lycopersicum',  'Tomato', 'Summer');
INSERT INTO Crop1 VALUES ('Brassica oleracea', 'Kale', 'Winter');
INSERT INTO Crop1 VALUES ('Allium cepa', 'Onion', 'Spring, Summer');
INSERT INTO Crop1 VALUES ('Brassica oleracea var. italica', 'Broccoli', 'Spring, Fall');

INSERT INTO HarvestYields2 VALUES (1500, 1200,  'Daucus carota');
INSERT INTO HarvestYields2 VALUES (500, 850, 'Lactuca sativa');
INSERT INTO HarvestYields2 VALUES (1800, 1100, 'Zea mays');
INSERT INTO HarvestYields2 VALUES (2000, 1800, 'Solanum lycopersicum');
INSERT INTO HarvestYields2 VALUES (400, 750, 'Brassica oleracea');

INSERT INTO HarvestYields2 VALUES (1000, 800,  'Daucus carota');
INSERT INTO HarvestYields2 VALUES (1000, 1700, 'Lactuca sativa');
INSERT INTO HarvestYields2 VALUES (2700, 1650, 'Zea mays');
INSERT INTO HarvestYields2 VALUES (500, 450, 'Solanum lycopersicum');
INSERT INTO HarvestYields2 VALUES (800, 1500, 'Brassica oleracea');
INSERT INTO HarvestYields2 VALUES (300, 1000, 'Brassica oleracea var. italica');

INSERT INTO HarvestYields1 VALUES (201, DATE '2026-05-10', 1500, 'Daucus carota');
INSERT INTO HarvestYields1 VALUES (202, DATE '2026-06-14', 500, 'Lactuca sativa');
INSERT INTO HarvestYields1 VALUES (203, DATE '2026-08-10', 1800, 'Zea mays');
INSERT INTO HarvestYields1 VALUES (204, DATE '2026-07-22', 2000, 'Solanum lycopersicum');
INSERT INTO HarvestYields1 VALUES (205, DATE '2026-12-05', 400, 'Brassica oleracea');

INSERT INTO HarvestYields1 VALUES (206, DATE '2026-05-10', 1000, 'Daucus carota');
INSERT INTO HarvestYields1 VALUES (207, DATE '2026-06-14', 1000, 'Lactuca sativa');
INSERT INTO HarvestYields1 VALUES (208, DATE '2026-08-10', 2700, 'Zea mays');
INSERT INTO HarvestYields1 VALUES (209, DATE '2026-08-10', 500, 'Solanum lycopersicum');
INSERT INTO HarvestYields1 VALUES (210, DATE '2026-12-05', 800, 'Brassica oleracea');
INSERT INTO HarvestYields1 VALUES (211, DATE '2025-08-16', 300, 'Brassica oleracea var. italica');

INSERT INTO Gardener2 VALUES ('Wang', 'wong@gmail.com');
INSERT INTO Gardener2 VALUES ('Smith', 'smith@gmail.com');
INSERT INTO Gardener2 VALUES ('Singh', 'singh@gmail.com');
INSERT INTO Gardener2 VALUES ('Kumar', 'kumar@outlook.com');
INSERT INTO Gardener2 VALUES ('Von', 'von@yahoo.com');
INSERT INTO Gardener2 VALUES ('Ahmed', 'ahmed@hotmail.com');

INSERT INTO Gardener3 VALUES ('David', 'wong@gmail.com');
INSERT INTO Gardener3 VALUES ('Lacy', 'smith@gmail.com');
INSERT INTO Gardener3 VALUES ('Sam', 'singh@gmail.com');
INSERT INTO Gardener3 VALUES ('George', 'kumar@outlook.com');
INSERT INTO Gardener3 VALUES ('King', 'von@yahoo.com');
INSERT INTO Gardener3 VALUES ('Adrian', 'ahmed@hotmail.com');

INSERT INTO Gardener4 VALUES (0, 1, 'wong@gmail.com');
INSERT INTO Gardener4 VALUES (1, 2, 'smith@gmail.com');
INSERT INTO Gardener4 VALUES (2, 3, 'singh@gmail.com');
INSERT INTO Gardener4 VALUES (3, 4, 'kumar@outlook.com');
INSERT INTO Gardener4 VALUES (2, 6, 'von@yahoo.com');
INSERT INTO Gardener4 VALUES (4, 5, 'ahmed@hotmail.com');

INSERT INTO Plot VALUES (0, 0, 1, 0);
INSERT INTO Plot VALUES (1, 1, 2, 0);
INSERT INTO Plot VALUES (10, 0, 3, 1);
INSERT INTO Plot VALUES (15, 1, 4, 1);
INSERT INTO Plot VALUES (230, 1, 5, 0);
INSERT INTO Plot VALUES (125, 0, 6, 0);

INSERT INTO WaterSchedule2 VALUES (3, 25, '10am');
INSERT INTO WaterSchedule2 VALUES (4, 15, '11am');
INSERT INTO WaterSchedule2 VALUES (6, 20, '12pm');
INSERT INTO WaterSchedule2 VALUES (6, 40, '6am');
INSERT INTO WaterSchedule2 VALUES (4, 11, '7am');

INSERT INTO WaterSchedule1 VALUES (3, 1, '10am', 24);
INSERT INTO WaterSchedule1 VALUES (4, 2, '11am', 16);
INSERT INTO WaterSchedule1 VALUES (6, 3, '12pm', 18);
INSERT INTO WaterSchedule1 VALUES (6, 4, '6am', 25);
INSERT INTO WaterSchedule1 VALUES (4, 5, '7am', 22);

INSERT INTO BedContains VALUES (1, 1, 1, 'Organic', 1, 1);
INSERT INTO BedContains VALUES (3, 2, 6, 'Synthetic', 2, 2);
INSERT INTO BedContains VALUES (9, 5, 4, 'Organic', 3, 3);
INSERT INTO BedContains VALUES (6, 7, 6, 'Biofertilizer', 4, 4);
INSERT INTO BedContains VALUES (2, 5, 1, 'Synthetic', 5, 5);
INSERT INTO BedContains VALUES (10, 10, 5, 'Magic', 2, 1);

INSERT INTO PlantingRecordTracks VALUES (1, 'Hill', 10, DATE '2026-07-30', DATE '2026-09-30', 1, 1);
INSERT INTO PlantingRecordTracks VALUES (2, 'Row', 12, DATE '2026-08-01', DATE '2026-09-01', 2, 2);
INSERT INTO PlantingRecordTracks VALUES (3, 'Strip', 1, DATE '2026-03-17', DATE '2026-04-15', 3, 3);
INSERT INTO PlantingRecordTracks VALUES (4, 'Broadcast', 23, DATE '2026-05-24', DATE '2026-10-23', 4, 4);
INSERT INTO PlantingRecordTracks VALUES (5, 'Raised Bed', 5, DATE '2026-03-10', DATE '2026-04-17', 5, 5);

INSERT INTO ToolShedLocatedAt1 VALUES (DATE '2026-07-01', 4);
INSERT INTO ToolShedLocatedAt1 VALUES (DATE '2026-04-01', 1);
INSERT INTO ToolShedLocatedAt1 VALUES (DATE '2026-06-15', 3);
INSERT INTO ToolShedLocatedAt1 VALUES (DATE '2026-07-15', 5);
INSERT INTO ToolShedLocatedAt1 VALUES (DATE '2025-05-15', 2);

INSERT INTO ToolShedLocatedAt2 VALUES (1, DATE '2026-07-01', 30, 18, 1);
INSERT INTO ToolShedLocatedAt2 VALUES (2, DATE '2026-06-15', 25, 15, 2);
INSERT INTO ToolShedLocatedAt2 VALUES (3, DATE '2026-07-15', 80, 45, 3);
INSERT INTO ToolShedLocatedAt2 VALUES (4, DATE '2025-05-15', 45, 23, 4);
INSERT INTO ToolShedLocatedAt2 VALUES (5, DATE '2026-04-01', 10, 6, 5);

INSERT INTO StoresAndCheckedOutEquipment1 VALUES (DATE '2026-03-15', 2);
INSERT INTO StoresAndCheckedOutEquipment1 VALUES (DATE '2026-04-15', 4);
INSERT INTO StoresAndCheckedOutEquipment1 VALUES (DATE '2026-05-15', 5);
INSERT INTO StoresAndCheckedOutEquipment1 VALUES (DATE '2026-05-22', 4);
INSERT INTO StoresAndCheckedOutEquipment1 VALUES (DATE '2026-06-22', 5);

INSERT INTO StoresAndCheckedOutEquipment2 VALUES (100, DATE '2026-03-15', 'Planting', 1, 1); -- GardenHoe
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (101, DATE '2026-05-22', 'Planting', 3, 2);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (102, DATE '2026-04-15', 'Planting', 2, NULL);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (103, DATE '2026-05-15', 'Planting', 4, 3);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (104, DATE '2026-06-22', 'Planting', 5, NULL);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (200, DATE '2026-03-15', 'Irrigation', 1, 1); -- WateringCan
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (201, DATE '2026-05-22', 'Irrigation', 1, 5);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (202, DATE '2026-04-15', 'Irrigation', 2, NULL);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (203, DATE '2026-05-15', 'Irrigation', 4, 3);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (204, DATE '2026-06-22', 'Irrigation', 5, NULL);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (300, DATE '2026-03-15', 'Digging', 3, NULL); -- Shovel
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (301, DATE '2026-05-22', 'Digging', 1, 1);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (302, DATE '2026-04-15', 'Digging', 2, 2);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (303, DATE '2026-05-15', 'Digging', 4, 3);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (304, DATE '2026-06-22', 'Digging', 5, NULL);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (400, DATE '2026-03-15', 'Trim', 1, 1); -- Pruner
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (401, DATE '2026-05-22', 'Trim', 3, 4);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (402, DATE '2026-04-15', 'Trim', 2, NULL);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (403, DATE '2026-05-15', 'Trim', 4, 3);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (404, DATE '2026-06-22', 'Trim', 3, 4);
INSERT INTO StoresAndCheckedOutEquipment2 VALUES (500, DATE '2026-06-22', 'Transportation', 5, NULL);

--------------- ISA Tuples ---------------

INSERT INTO GardenHoe VALUES (100, 12, 2, DATE '2026-04-30');
INSERT INTO GardenHoe VALUES (101, 16, 3, DATE '2026-05-12');
INSERT INTO GardenHoe VALUES (102, 43, 6, DATE '2026-04-15');
INSERT INTO GardenHoe VALUES (103, 0, 6, DATE '2026-05-22');
INSERT INTO GardenHoe VALUES (104, 67, 7, DATE '2026-06-07');

INSERT INTO WateringCan VALUES (200, 10, 'Rose shower', 'Plastic');
INSERT INTO WateringCan VALUES (201, 15, 'Rose shower', 'Steel');
INSERT INTO WateringCan VALUES (202, 5, 'Narrow stream', 'Plastic');
INSERT INTO WateringCan VALUES (203, 5, 'Rose shower', 'Plastic');
INSERT INTO WateringCan VALUES (204, 10, 'Narrow stream', 'Steel');

INSERT INTO Shovel VALUES (300, 'Fiskars', 'Round Point', 48);
INSERT INTO Shovel VALUES (301, 'Garant', 'Scoop', 44);
INSERT INTO Shovel VALUES (302, 'True Temper', 'Square Point', 46);
INSERT INTO Shovel VALUES (303, 'Bully Tools', 'Trenching', 21);
INSERT INTO Shovel VALUES (304, 'AMES', 'Drain', 1);

INSERT INTO Pruner VALUES (400, 'Felco', 8, 'Bypass');
INSERT INTO Pruner VALUES (401, 'Corona', 11, 'Anvil');
INSERT INTO Pruner VALUES (402, 'Felco', 10, 'Anvil');
INSERT INTO Pruner VALUES (403, 'Okatsune', 5, 'Floral snips');
INSERT INTO Pruner VALUES (404, 'Corona', 6, 'Bypass');

--------------- Relationship Tuples ---------------

INSERT INTO Logs VALUES (1, 201);
INSERT INTO Logs VALUES (2, 202);
INSERT INTO Logs VALUES (3, 203);
INSERT INTO Logs VALUES (4, 204);
INSERT INTO Logs VALUES (5, 205);

INSERT INTO Taken VALUES (201,1, 1);
INSERT INTO Taken VALUES (202, 2, 2);
INSERT INTO Taken VALUES (202, 3, 3);
INSERT INTO Taken VALUES (204, 4, 4);
INSERT INTO Taken VALUES (205, 5, 5);

INSERT INTO PlantedIn VALUES (1, 1, 'Daucus carota');
INSERT INTO PlantedIn VALUES (2, 2, 'Lactuca sativa');
INSERT INTO PlantedIn VALUES (3, 3, 'Zea mays');
INSERT INTO PlantedIn VALUES (4, 4, 'Solanum lycopersicum');
INSERT INTO PlantedIn VALUES (5, 5, 'Brassica oleracea');

INSERT INTO Records VALUES ('Daucus carota', 1);
INSERT INTO Records VALUES ('Zea mays', 2);
INSERT INTO Records VALUES ('Zea mays', 3);
INSERT INTO Records VALUES ('Solanum lycopersicum', 4);
INSERT INTO Records VALUES ('Brassica oleracea', 5);

INSERT INTO Rents VALUES (1, 1);
INSERT INTO Rents VALUES (2, 4);
INSERT INTO Rents VALUES (3, 3);
INSERT INTO Rents VALUES (4, 2);
INSERT INTO Rents VALUES (5, 5);
INSERT INTO Rents VALUES (3, 5);
INSERT INTO Rents VALUES (2, 1);
INSERT INTO Rents VALUES (2, 3);

INSERT INTO AssignedTo VALUES (1, 2);
INSERT INTO AssignedTo VALUES (4, 5);
INSERT INTO AssignedTo VALUES (2, 3);
INSERT INTO AssignedTo VALUES (3, 4);
INSERT INTO AssignedTo VALUES (5, 1);

INSERT INTO Oversees VALUES (1, 5);
INSERT INTO Oversees VALUES (2, 4);
INSERT INTO Oversees VALUES (3, 3);
INSERT INTO Oversees VALUES (4, 2);
INSERT INTO Oversees VALUES (5, 1);
